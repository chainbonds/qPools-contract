/**
 * TODO: Use a more sophisticated checking etc,
 */
export const solToLamports = (x: number) => {
    return x * 1_000_000_000;
}

export const lamportsToSol = (x: number) => {
    return x / 1_000_000_000;
}