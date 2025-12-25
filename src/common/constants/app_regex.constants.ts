class AppRegex {
  static readonly nameRegex = /^[A-Z][a-z]{1,24}$/;

  static readonly fullNameRegex = /^[A-Z][a-z]{1,24}\s[A-Z][a-z]{1,24}$/;

  static readonly passwordRegex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\W).{8,}$/;

  static readonly otpRegex = /^\d{6}$/;

  static readonly tokenRegex = /^.+\..+\..+$/;

  static readonly bearerWithTokenRegex =
    /^(BUser|BSystem|BSuperSystem)\ .+\..+\..+$/;

  static readonly phoneNumberRegex = /^(\+20)(10|11|12|15)\d{8}$/;

  static readonly getFileWithUrlRegex =
    /^(users)\/[0-9a-f]{24}\/.+\.(jpeg|jpg|png|gif)/;

  static readonly addressRegex =
    /^(?=.{10,1000}$)(\d+\s+)?[A-Za-z0-9\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}$/;
}

export default AppRegex;
