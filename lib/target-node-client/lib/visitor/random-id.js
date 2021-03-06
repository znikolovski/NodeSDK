/*************************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2017 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by all applicable intellectual property
 * laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

/*********************************************************************
 * Function _generateID(method): Generate a random 128bit ID
 *     method = Optional ID generation method
 *              0 = Decimal 2 63bit numbers
 *              1 = Hex 2 63bit numbers
 * Returns: Random 128bit ID as a string
 *********************************************************************/

function generateRandomId(method) {
  let digits = "0123456789", high = "", low = "";
  /* The first nibble can't have the left-most bit set because we are deailing with signed 64bit numbers. */
  let digitNum, digitValue, digitValueMax = 8, highDigitValueMax = 10, lowDigitValueMax = 10;

  // TODO Extract this portion into a separate function.
  if (method === 1) {
    digits += "ABCDEF";

    for (digitNum = 0; digitNum < 16; digitNum++) {
      digitValue = Math.floor(Math.random() * digitValueMax);
      high += digits.substring(digitValue, (digitValue + 1));
      digitValue = Math.floor(Math.random() * digitValueMax);
      low += digits.substring(digitValue, (digitValue + 1));
      digitValueMax = 16;
    }

    return high + "-" + low;
  }

  /*
   * We're dealing with 2 signed, but positive, 64bit numbers so the max for high and low is:
   * 9222372036854775807
   *    ^---------------- The 4th digit could actually be a 3 if we wanted to add more max checks
   *                      but we set the max to 2 to avoid them
   */
  for (digitNum = 0; digitNum < 19; digitNum++) {
    digitValue = Math.floor(Math.random() * highDigitValueMax);
    high += digits.substring(digitValue, (digitValue + 1));

    if ((digitNum === 0) && (digitValue === 9)) {
      highDigitValueMax = 3;
    } else if (((digitNum === 1) || (digitNum === 2)) && (highDigitValueMax !== 10) && (digitValue < 2)) {
      highDigitValueMax = 10;
    } else if (digitNum > 2) {
      highDigitValueMax = 10;
    }

    digitValue = Math.floor(Math.random() * lowDigitValueMax);
    low += digits.substring(digitValue, (digitValue + 1));

    if ((digitNum === 0) && (digitValue === 9)) {
      lowDigitValueMax = 3;
    } else if (((digitNum === 1) || (digitNum === 2)) && (lowDigitValueMax !== 10) && (digitValue < 2)) {
      lowDigitValueMax = 10;
    } else if (digitNum > 2) {
      lowDigitValueMax = 10;
    }
  }

  return high + low;
}

module.exports = generateRandomId;
