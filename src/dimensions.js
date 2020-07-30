const getRelativeBox = (d) => {
  if (d.relativeBox) {
    // console.log('Got relative box', d.relativeBox);
    return d.relativeBox;
  } 
  // console.log('No relative box');
  const _x = d._box._x / d._imageDims._width;
  const _y = d._box._y / d._imageDims._height;
  const _width = d._box._width / d._imageDims._width;
  const _height = d._box._height / d._imageDims._height;
  return { _x, _y, _width, _height };
};

module.exports = { getRelativeBox };
