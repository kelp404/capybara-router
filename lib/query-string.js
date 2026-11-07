const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * @param {number} byte - The UTF-8 byte.
 * @returns {boolean} - Is it a hex digit? (0-9, A-F, a-f)
 */
const isHexDigit = byte => (byte >= 0x30 && byte <= 0x39)
  || (byte >= 0x41 && byte <= 0x46)
  || (byte >= 0x61 && byte <= 0x66);

/**
 * Percent-decode the value like URLSearchParams.
 * Note: Work on UTF-8 bytes, so it is linear and invalid sequences become U+FFFD.
 * We don't use URLSearchParams because Node.js truncates non-ASCII characters when the value has malformed escapes.
 * @param {string} value - The encoded value.
 * @returns {string} - The decoded value.
 */
const decode = value => {
  const bytes = textEncoder.encode(value.replace(/\+/g, ' '));
  const result = [];
  for (let index = 0; index < bytes.length; index++) {
    if (bytes[index] === 0x25 && isHexDigit(bytes[index + 1]) && isHexDigit(bytes[index + 2])) {
      result.push(Number.parseInt(String.fromCharCode(bytes[index + 1], bytes[index + 2]), 16));
      index += 2;
    } else {
      result.push(bytes[index]);
    }
  }

  return textDecoder.decode(Uint8Array.from(result));
};

/**
 * Replace lone surrogates with U+FFFD like URLSearchParams, because encodeURIComponent throws URIError on them.
 * @param {string} value - The value.
 * @returns {string} - The well-formed value.
 */
const toWellFormed = value => value.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g, x => (x.length === 2 ? x : '\uFFFD'));

/**
 * Percent-encode the value with RFC 3986 (also encode !'()*).
 * @param {string} value - The value.
 * @returns {string} - The encoded value.
 */
const encode = value => encodeURIComponent(toWellFormed(String(value)))
  .replace(/[!'()*]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);

/**
 * Cast non-primitive values to strings.
 * @param {*} value - The query value.
 * @returns {*} - The primitive value.
 */
const toPrimitive = value => (
  value !== null && (typeof value === 'object' || typeof value === 'function') ? String(value) : value
);

module.exports = {
  /**
   * Parse the query string.
   * ex: '?a=1&a=2&b' -> {a: ['1', '2'], b: null}
   * @param {string} search - The query string.
   * @returns {Object} - The query without the prototype.
   */
  parse(search) {
    const result = Object.create(null);
    search.trim().replace(/^[?#&]/, '').split('&').forEach(segment => {
      if (!segment) {
        return;
      }

      const separatorIndex = segment.indexOf('=');
      const key = decode(separatorIndex < 0 ? segment : segment.slice(0, separatorIndex));
      const value = separatorIndex < 0 ? null : decode(segment.slice(separatorIndex + 1));
      if (!(key in result)) {
        result[key] = value;
      } else if (Array.isArray(result[key])) {
        // Push instead of concat, so repeated keys stay linear.
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    });
    return result;
  },
  /**
   * Stringify the query with sorted keys.
   * ex: {b: null, a: ['1', '2'], c: undefined} -> 'a=1&a=2&b'
   * @param {Object} query - The query.
   * @returns {string} - The query string without "?".
   */
  stringify(query) {
    return Object.keys(query).sort()
      .flatMap(key => [].concat(query[key])
        .filter(value => value !== undefined)
        .map(value => {
          const primitive = toPrimitive(value);
          return primitive === null ? encode(key) : `${encode(key)}=${encode(primitive)}`;
        }))
      .join('&');
  },
};
