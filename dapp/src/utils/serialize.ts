import {Keypair} from "@solana/web3.js";

export const serializeSecretKey = (secretKeyByteArray: Uint8Array) => {
    const out: string = secretKeyByteArray.toString();
    return out
}

export const deserializeSecretKey = (secretKeyByteStringRepresentation: string) => {
    const newArray: number[] = secretKeyByteStringRepresentation.split(',').map((x: string) => Number(x));
    const out: Uint8Array = new Uint8Array(newArray);
    return out;
}

const compareTwoArraysForEquality = (array1: Uint8Array, array2: Uint8Array) => {
    return array1.length === array2.length && array1.every((value, index) => value === array2[index])
}

const testSerializeDeserizalize = () => {
    const testAccountKeypair = Keypair.generate();

    const initialSecretKey: Uint8Array = testAccountKeypair.secretKey;

    const stringRepresentation: string = testAccountKeypair.secretKey.toString();

    // Super powerful
    // var buffer2 = new Buffer(st, 'u8');
    // Buffer.from(str, 'u8') and buf.toString('base64')
    const newArray: number[] = stringRepresentation.split(',').map((x: string) => Number(x));
    const lastSecretKey: Uint8Array = new Uint8Array(newArray);

    console.log("Initial secret key is: ", initialSecretKey);
    console.log("Initial secret key string representation is: ", stringRepresentation);
    console.log("Secret Key new Array is. ", newArray.toString());
    console.log("Final secret key is ", lastSecretKey);

    if (!compareTwoArraysForEquality(initialSecretKey, lastSecretKey)) {
        console.log("AGHHHHH DEATHH");
        console.log(initialSecretKey);
        console.log(lastSecretKey);
        return
    }
    console.log(initialSecretKey);
    console.log(lastSecretKey);

    return
}