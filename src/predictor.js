
function decodeRowAcc(row, stride, bytesPerSample) {
  var length = row.length;
  length -= stride;
  var offset = 0;
  do {
    for (var i = stride; i > 0; i--) {
      row[offset + stride] += row[offset];
      offset++;
    }

    length -= stride;
  } while (length > 0);
}

function decodeRowFloatingPoint(row, stride, bytesPerSample) {
  var index = 0;
  var count = row.length;
  var wc = count / bytesPerSample;
  var i;

  while (count > stride) {
    for (i = stride; i > 0; --i) {
      row[index + stride] += row[index];
      ++index;
    }
    count -= stride;
  }

  var copy = row.slice();
  for (i = 0; i < wc; ++i) {
    for (var b = 0; b < bytesPerSample; ++b) {
      row[bytesPerSample * i + b] = copy[(bytesPerSample - b - 1) * wc + i];
    }
  }
}

module.exports = {
  applyPredictor: function applyPredictor(block, predictor, width, height, bitsPerSample) {
    var i;
    var row;
    if (!predictor || predictor === 1) {
      return block;
    }

    for (i = 0; i < bitsPerSample.length; ++i) {
      if (bitsPerSample[i] % 8 !== 0) {
        throw new Error('When decoding with predictor, only multiple of 8 bits are supported.');
      }
      if (bitsPerSample[i] !== bitsPerSample[0]) {
        throw new Error('When decoding with predictor, all samples must have the same size.');
      }
    }

    var bytesPerSample = bitsPerSample[0] / 8;
    var stride = bitsPerSample.length;

    for (i = 0; i < height; ++i) {
      if (predictor === 2) { // horizontal prediction
        
        switch (bitsPerSample[0]) {
          case 8:
            row = new Uint8Array(block, i * stride * width * bytesPerSample, stride * width * bytesPerSample);
            break;
          case 16:
            row = new Uint16Array(block, i * stride * width * bytesPerSample, stride * width * bytesPerSample / 2);
            break;
          case 32:
            row = new Uint32Array(block, i * stride * width * bytesPerSample, stride * width * bytesPerSample / 4);
            break;
          default:
            throw new Error(`Predictor 2 not allowed with ${bitsPerSample[0]} bits per sample.`);
        }
        decodeRowAcc(row, stride, bytesPerSample);
      } else if (predictor === 3) { // horizontal floating point
        row = new Uint8Array(block, i * stride * width * bytesPerSample, width * bytesPerSample);
        decodeRowFloatingPoint(row, stride, bytesPerSample);
      }
    }
    return block;
  }
};
