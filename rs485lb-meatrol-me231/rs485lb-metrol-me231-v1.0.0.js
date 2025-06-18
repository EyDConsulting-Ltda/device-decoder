/**
 * @sensor Decode Meatrol ME231 RS485LB
 * @date 2025
 * @author Alejandro Paz
 */

/**
 * Decode uplink function.
 */
function decodeUplink(input) {
  return {
    data: Decode(input.fPort, input.bytes, input.variables),
  };
}

/**
 * Encode downlink function.
 */
function encodeDownlink(input) {
  return {};
}

/**
 * Decode.
 */
function Decode(fPort, bytes, variables) {
  // Puerto por el cual envía los datos el nodo.
  if (fPort == 5) {
    var decode = {};

    // Battery.
    decode.battery = (((bytes[0] << 8) | bytes[1]) & 0x7fff) / 1000;

    // Se valida que vengan datos.
    
    // IO Values.
    const IOValues = {
      input0: "-",
      input1: "-",
      input2: "-",
      input3: "-",
      input4: "-",
      input5: "-",
      output0: "-",
      output1: "-",
      output2: "-",
      output3: "-",
      output4: "-",
      output5: "-",
    };

    decode.IOValues = IOValues;
    // Decode return.
    return decode;
  }
}
