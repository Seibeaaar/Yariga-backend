/* eslint-disable no-useless-escape */
import dayjs from "dayjs";

export const EMAIL_REGEX =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
export const PASSWORD_REGEX =
  /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
export const NAME_REGEX = /^(?=.{1,50}$)[a-z]+(?:['_.\s][a-z]+)*$/i;
export const PHONE_NUMBER_REGEX = /^\([0-9]{3}\)[0-9]{3}-[0-9]{4}$/;

export const TAX_NUMBER_REGEX =
  /^(01|02|03|04|05|06|10|11|12|13|14|15|16|20|21|22|23|24|25|26|27|30|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|46|47|48|50|51|52|53|54|55|56|57|58|59|60|61|62|63|64|65|66|67|68|71|72|73|74|75|76|77|80|81|82|83|84|85|85|86|86|87|87|88|88|90|91|92|92|93|94|95|98|99|)-\d{7}$/;

export const validateEmail = (v: string) => EMAIL_REGEX.test(v);
export const validatePassword = (v: string) => PASSWORD_REGEX.test(v);
export const validateFirstName = (v: string) => NAME_REGEX.test(v);
export const validateLastName = (v: string) => NAME_REGEX.test(v);
export const validatePhoneNumber = (v: string) => PHONE_NUMBER_REGEX.test(v);

export const validateTaxNumber = (v: string) => TAX_NUMBER_REGEX.test(v);

export const validateDateOfBirth = (v: string) => {
  if (!dayjs(v).isValid()) {
    return false;
  }
  return dayjs().year() - dayjs(v).year();
};
