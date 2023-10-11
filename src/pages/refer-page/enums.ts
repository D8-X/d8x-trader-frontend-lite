/**
 * @member DEFAULT
 * @member CODE_TAKEN signifies that the code does already exist - can be redeemed
 * @member CODE_AVAILABLE signifies that the code does not exist - cannot be redeemed
 */
export enum CodeStateE {
  DEFAULT,
  CODE_TAKEN,
  CODE_AVAILABLE,
}
