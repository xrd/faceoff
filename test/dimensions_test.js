const expect = require('expect');
const { getRelativeBox } = require('../src/dimensions');

const imgDims = { _width: 3024, _height: 4032 };
const _box = {
  _x: 700.2510538101196,
  _y: 536.7655563354492,
  _width: 340.8471136093139,
  _height: 482.0116195678711,
};
const relativeBox = {
  _x: 0.23156450192133585,
  _y: 0.1331263780593872,
  _width: 0.1127139925956726,
  _height: 0.11954653263092041,
};

// const d = {
//   "_imageDims": { "_width": 4032, "_height": 3024 },
//   "_score": 0.7230772376060486,
//   "_classScore": 0.7230772376060486,
//   "_className": "",
//   "_box": {
//     "_x": 646.311882019043,
//     "_y": 1757.6430187225342,
//     "_width": 65.41707801818848,
//     "_height": 80.82665634155273
//   }
// };

const d = {
  _imageDims: imgDims,
  _box,
};

describe('#dimensions', () => {
  describe('#getRelativeBox', () => {
    it('should get a relative box from regular box', () => {
      expect(getRelativeBox(d)).toEqual(relativeBox);
    });
  });
});
