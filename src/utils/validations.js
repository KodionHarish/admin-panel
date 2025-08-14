import * as Yup from "yup";

export const registerSchema = Yup.object({
  firstname: Yup.string().trim().required("First name is required"),
  lastname: Yup.string().trim().required("Last name is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters long")
    .required("Password is required"),
});

export const loginSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export const profileSchema = Yup.object({
  firstname: Yup.string().trim().required("First name is required"),
  lastname: Yup.string().trim().required("Last name is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  phoneNumber: Yup.string().required("Phone number is required"),
  address: Yup.string().trim().required("Address is required"),
  city: Yup.string().trim().required("City is required"),
  zipcode: Yup.string()
    .matches(/^\d{5}(-\d{4})?$/, "Invalid zipcode format")
    .required("Zipcode is required"),
  state: Yup.string().trim().required("State is required"),
  country: Yup.string().trim().required("Country is required"),
});

export const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .max(50, "Password can be at most 50 characters")
    .test(
      "password-strength",
      "Password must contain at least one digit, one lowercase letter, one uppercase letter, and one special character.",
      (value) => {
        const hasDigit = /\d/.test(value);
        const hasLowercase = /[a-z]/.test(value);
        const hasUppercase = /[A-Z]/.test(value);
        const hasSpecialChar = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(value);
        return hasDigit && hasLowercase && hasUppercase && hasSpecialChar;
      }
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords do not match")
    .required("Confirm Password is required"),
});