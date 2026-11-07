const queryString = require('../lib/query-string');

test('Parse the query string.', () => {
  expect(queryString.parse('')).toEqual({});
  expect(queryString.parse('?')).toEqual({});
  expect(queryString.parse('?a=1&b=2')).toEqual({a: '1', b: '2'});
  expect(queryString.parse('a=1')).toEqual({a: '1'});
  expect(queryString.parse('?&&a=1&&')).toEqual({a: '1'});
  expect(queryString.parse('?a=b=c')).toEqual({a: 'b=c'});
  expect(queryString.parse('?a[]=1&a.b=2')).toEqual({'a[]': '1', 'a.b': '2'});
  expect(queryString.parse('? a = 1 ')).toEqual({' a ': ' 1'});
  expect(queryString.parse('??a=1')).toEqual({'?a': '1'});
});

test('Parse null and empty values in the query string.', () => {
  expect(queryString.parse('?a&b=')).toEqual({a: null, b: ''});
  expect(queryString.parse('?=1')).toEqual({'': '1'});
});

test('Parse repeated keys in the query string as an array.', () => {
  expect(queryString.parse('?a=1&a=2&a')).toEqual({a: ['1', '2', null]});
  expect(queryString.parse('?a=1,2')).toEqual({a: '1,2'});
});

test('Parse the query string without the prototype.', () => {
  const result = queryString.parse('?__proto__=x&toString=y');
  expect(Object.getPrototypeOf(result)).toBeNull();
  expect(Object.keys(result)).toEqual(['__proto__', 'toString']);
  expect(result.__proto__).toBe('x'); // eslint-disable-line no-proto
  expect(result.toString).toBe('y');
});

test('Decode the query string.', () => {
  expect(queryString.parse('?a=hello%20world&b=hello+world')).toEqual({a: 'hello world', b: 'hello world'});
  expect(queryString.parse('?%E4%B8%AD=%E6%96%87&%2B=%2B')).toEqual({中: '文', '+': '+'});
  expect(queryString.parse('?a=%3D%26')).toEqual({a: '=&'});
  expect(queryString.parse('?a=中%41')).toEqual({a: '中A'});
});

test('Decode malformed escapes in the query string.', () => {
  expect(queryString.parse('?a=%&b=%zz&c=%2')).toEqual({a: '%', b: '%zz', c: '%2'});
  expect(queryString.parse('?a=%FF&b=%C3&c=%E0%A4%A')).toEqual({a: '�', b: '�', c: '�%A'});
  expect(queryString.parse('?a=%C3%A9%FF')).toEqual({a: 'é�'});
  // Node.js URLSearchParams and querystring decode these to "�-" and "%2[]b-A".
  expect(queryString.parse('?a=%C3中&b=%2[]b中%41')).toEqual({a: '�中', b: '%2[]b中A'});
});

test('Parse the long malformed query string in linear time.', () => {
  const toHex = number => number.toString(16).padStart(2, '0');
  const search = `?a=%FF${Array.from({length: 32000}, (_, index) => `%${toHex(Math.floor(index / 256))}%${toHex(index % 256)}`).join('x')}`;
  const startTime = Date.now();
  queryString.parse(search);
  expect(Date.now() - startTime).toBeLessThan(1000);
});

test('Parse the long query string with repeated keys in linear time.', () => {
  const search = `?${Array.from({length: 40000}, () => 'a=1').join('&')}`;
  const startTime = Date.now();
  expect(queryString.parse(search).a).toHaveLength(40000);
  expect(Date.now() - startTime).toBeLessThan(1000);
});

test('Stringify the query with sorted keys.', () => {
  expect(queryString.stringify({})).toBe('');
  expect(queryString.stringify({b: 1, a: 2, c: 3})).toBe('a=2&b=1&c=3');
});

test('Stringify primitive values of the query.', () => {
  expect(queryString.stringify({
    string: 'x',
    number: 0,
    nan: Number.NaN,
    boolean: false,
    bigint: BigInt(10),
    empty: '',
    null: null,
    undefined,
  })).toBe('bigint=10&boolean=false&empty=&nan=NaN&null&number=0&string=x');
});

test('Stringify arrays of the query.', () => {
  expect(queryString.stringify({a: ['1', '2'], b: ['x', null, undefined], c: []})).toBe('a=1&a=2&b=x&b');
});

test('Stringify non-primitive values of the query.', () => {
  expect(queryString.stringify({
    object: {a: 1},
    custom: {toString: () => 'custom'},
    stringObject: new String('s'), // eslint-disable-line no-new-wrappers
    nested: [['x', 'y']],
  })).toBe('custom=custom&nested=x%2Cy&object=%5Bobject%20Object%5D&stringObject=s');
});

test('Encode lone surrogates of the query as U+FFFD.', () => {
  expect(queryString.stringify({a: '\uD800', '\uDC00': 'b', c: '😀'.slice(0, 1), d: '😀'})).toBe('a=%EF%BF%BD&c=%EF%BF%BD&d=%F0%9F%98%80&%EF%BF%BD=b');
});

test('Encode the query.', () => {
  expect(queryString.stringify({'a b': 'a b', 中: '文', special: '!\'()*~-._', amp: 'a&b=c', percent: '100%', plus: '1+1'}))
    .toBe('a%20b=a%20b&amp=a%26b%3Dc&percent=100%25&plus=1%2B1&special=%21%27%28%29%2A~-._&%E4%B8%AD=%E6%96%87');
});
