/**
 * @sensor Decode Meatrol ME231 RS485LB
 * @date 2025
 * @author Alejandro Paz
 */

/**
 * Comandos AT que se deben configurar en el nodo RS485-LB:
    -  (Password)          => ****** (Ej:123456, clave por defecto o la seteada por Leider)
    -  (Modo ABP)          => AT+NJM=0
    -  (Sub-banda)         => AT+CHE=2
    -  (Tiempo-sincro)     => AT+TDC=300000 (Ej:5 Min)
    -  (Corriente-Fase)    => AT+COMMAND1= 01 03 03 e8 00 06 ,1 (0x01=ID, 0x03=Command, 0x03f2(1000 Dec)=Tipo de Dato, 0x0006=Valor por defecto)
    -  (Voltaje-Fase)      => AT+COMMAND2= 01 03 03 f2 00 06 ,1 (0x01=ID, 0x03=Command, 0x03f2(1010 Dec)=Tipo de Dato, 0x0006=Valor por defecto)
    -  (Voltaje-Línea)     => AT+COMMAND3= 01 03 03 fc 00 06 ,1 (0x01=ID, 0x03=Command, 0x03f2(1020 Dec)=Tipo de Dato, 0x0006=Valor por defecto)
    -  (Potencia-Activa)   => AT+COMMAND4= 01 03 04 04 00 06 ,1 (0x01=ID, 0x03=Command, 0x03f2(1028 Dec)=Tipo de Dato, 0x0006=Valor por defecto)
    -  (Potencia-Reactiva) => AT+COMMAND5= 01 03 04 0c 00 06 ,1 (0x01=ID, 0x03=Command, 0x03f2(1036 Dec)=Tipo de Dato, 0x0006=Valor por defecto)
    -  (Potencia-Aparente) => AT+COMMAND6= 01 03 04 14 00 06 ,1 (0x01=ID, 0x03=Command, 0x03f2(1044 Dec)=Tipo de Dato, 0x0006=Valor por defecto)
    -  (Factor-Potencia)   => AT+COMMAND7= 01 03 04 24 00 06 ,1 (0x01=ID, 0x03=Command, 0x03f2(1060 Dec)=Tipo de Dato, 0x0006=Valor por defecto)
 */

/**
 * Comandos AT para obtener solo los valores de la trama enviada por el sensor(Meatrol ME231):
    -  AT+DATACUT1=17,2,1~15
    -  AT+DATACUT2=17,2,1~15
    -  AT+DATACUT3=17,2,1~15
    -  AT+DATACUT4=17,2,1~15
    -  AT+DATACUT5=17,2,1~15
    -  AT+DATACUT6=17,2,1~15
    -  AT+DATACUT7=17,2,1~15
 */

/**
 * El sensor(Meatrol ME231) envía los datos en el siguiente orden previa configuración:
    -  Corriente de fase   (L1-L2-L3)
    -  Voltaje de fase     (L1-L2-L3)
    -  Voltaje de línea    (L1-L2-L3)
    -  Potencia Activa     (L1-L2-L3)
    -  Potencia Reactiva   (L1-L2-L3)
    -  Potencia Aparente   (L1-L2-L3)
    -  Factor de Potencia  (L1-L2-L3)
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
  // Se debe configurar el puerto Nº5 en los ajustes del nodo.
  if (fPort == 5) {
    // variable donde se guardan los datos decodificados.
    let decode = {};

    // Batería.
    decode.battery = (((bytes[0] << 8) | bytes[1]) & 0x7fff) / 1000;

    // Se valida que vengan todos los datos.
    if (bytes.length === 0x006c) {
      // Se decodifican los datos.
      const resultado = hexToFloat32Groups(bytes);

      // IO Values.
      const IOValues = {
        input0: resultado[0], //  Corriente de fase.
        input1: resultado[1], //  Voltaje de fase.
        input2: resultado[2], //  Voltaje de línea.
        input3: resultado[3], //  Potencia Activa.
        input4: resultado[4], //  Potencia Reactiva.
        input5: resultado[5], //  Potencia Aparente.
        input6: resultado[6], //  Factor de Potencia.
        output0: "-",
        output1: "-",
        output2: "-",
        output3: "-",
        output4: "-",
        output5: "-",
        output6: "-",
      };

      // Se guardan los datos en el objeto.
      decode.IOValues = IOValues;
    }

    // Se retornan los datos decodificados.
    return decode;
  }
}

/**
  Función para decodificar los datos por línea.
**/
function hexToFloat32Groups(dataHex) {
  const grupos = [];
  let i = 0;

  while (i < dataHex.length - 4) {
    // Se busca el inicio de la trama: dirección = 0x01, función = 0x03, longitud = 0x0C (12 bytes = 3 floats).
    if (
      dataHex[i] === 0x01 &&
      dataHex[i + 1] === 0x03 &&
      dataHex[i + 2] === 0x0c
    ) {
      const dataStart = i + 3;
      const dataEnd = dataStart + 12; // 3 float32 = 12 bytes.

      if (dataEnd <= dataHex.length) {
        const valores = [];
        for (let j = 0; j < 12; j += 4) {
          const floatBytes = dataHex.slice(dataStart + j, dataStart + j + 4);
          const buffer = new ArrayBuffer(4);
          const view = new DataView(buffer);
          floatBytes.forEach((b, k) => view.setUint8(k, b));
          valores.push(view.getFloat32(0, false));
        }

        // Se agrega un grupo como objeto con claves L1, L2, L3.
        grupos.push({
          L1: valores[0].toFixed(2),
          L2: valores[1].toFixed(2),
          L3: valores[2].toFixed(2),
        });
      }

      i++;
    } else {
      i++;
    }
  }

  // Se retornan los datos.
  return grupos;
}
