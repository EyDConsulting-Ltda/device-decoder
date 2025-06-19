/**
 * @sensor Decode EnviroPro EP100G-08 SDI12-LB
 * @date 2025
 * @author Alejandro Paz
 */

/**
 * Comandos AT que se deben configurar en el nodo SDI12-LB:
    -  (Password)          => ****** (Ej:123456, clave por defecto o la seteada por Leider)
    -  (Modo ABP)          => AT+NJM=0
    -  (Sub-banda)         => AT+CHE=2
    -  (Tiempo-sincro)     => AT+TDC=300000 (Ej:5 Min => Seg.)
    -  (Tiempo-sincro)     => AT+PORT=2
    -  (Get-data-hum)      => AT+COMMAND1=0C!,2,0,0
    -  (Read-data-hum)     => AT+COMMAND2=0D0!,0,0,0
    -  (Get-data-ec)       => AT+COMMAND3=0C1!,2,0,0
    -  (Read-data-ec)      => AT+COMMAND4=0D0!,0,0,0
 */

/**
 * Comandos AT para obtener solo los valores de la trama enviada por el sensor(EnviroPro EP100G-081):
    -  AT+DATACUT1=6,2,1~6
    -  AT+DATACUT2=0,0,0
    -  AT+DATACUT3=6,2,1~6
    -  AT+DATACUT4=0,0,0
 */

/**
 * El sensor(EnviroPro EP100G-081) envía los datos en el siguiente orden previa configuración:
    -  Sensor1    (HUM-EC) => HUMEDAD-CONDUCTIVIDAD ELECTRICA
    -  Sensor2    (HUM-EC) => HUMEDAD-CONDUCTIVIDAD ELECTRICA
    -  Sensor3    (HUM-EC) => HUMEDAD-CONDUCTIVIDAD ELECTRICA
    -  ...
    -  Sensor8    (HUM-EC) => HUMEDAD-CONDUCTIVIDAD ELECTRICA
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
  // Se debe configurar el puerto Nº2 en los ajustes del nodo.
  if (fPort == 2) {
    // variable donde se guardan los datos decodificados.
    let decode = {};

    // Batería.
    decode.battery = (((bytes[0] << 8) | bytes[1]) & 0x7fff) / 1000;
    // Payload Ver.
    decode.Payver = bytes[2];

    // Se valida que vengan todos los datos.
    if (bytes.length === 0x008d) {
      // Se decodifican los datos.
      const resultado = parseF2F4(bytes);

      // IO Values.
      const IOValues = {
        input0: resultado[0], //  Sensor 1
        input1: resultado[1], //  Sensor 2
        input2: resultado[2], //  Sensor 3
        input3: resultado[3], //  Sensor 4
        input4: resultado[4], //  Sensor 5
        input5: resultado[5], //  Sensor 6
        input6: resultado[6], //  Sensor 7
        input7: resultado[7], //  Sensor 8
        output0: "-",
        output1: "-",
        output2: "-",
        output3: "-",
        output4: "-",
        output5: "-",
        output6: "-",
        output7: "-",
      };

      // Se guardan los datos en el objeto.
      decode.IOValues = IOValues;
    }

    // Se retornan los datos decodificados.
    return decode;
  }
}

/**
  Función para decodificar los datos por sensor.
**/
function parseF2F4(hexString) {
  // Se genera un nuevo buffer con los bytes.
  const buffer = Buffer.from(hexString);
  // El buffer se pasa a String en base Hex.
  const hex = buffer.toString("hex").toLowerCase();

  function parseBlock(marker) {
    const idx = hex.indexOf(marker);
    if (idx === -1) return [];

    const lengthByte = hex.slice(idx + marker.length, idx + marker.length + 2);
    const length = parseInt(lengthByte, 16);

    // Índice del inicio real de los datos:
    // [marker (2 hex)] + [length (2 hex)] + [ID (2 hex)] = 6 caracteres hex.
    const dataStart = idx + marker.length + 2 + 2;
    const dataEnd = dataStart + length * 2;
    const dataHex = hex.slice(dataStart, dataEnd);

    const ascii = dataHex
      .match(/.{1,2}/g)
      .map((byte) => String.fromCharCode(parseInt(byte, 16)))
      .join("");

    const values = ascii.match(/[+-]\d{2,3}\.\d{2,3}/g)?.map(parseFloat) || [];
    return values;
  }

  const hum = parseBlock("f2");
  const ec = parseBlock("f4");

  const numSensors = Math.min(hum.length, ec.length);
  const result = [];

  for (let i = 0; i < numSensors; i++) {
    result.push({
      hum: hum[i],
      ec: ec[i],
    });
  }

  // Se retornan los datos.
  return result;
}
