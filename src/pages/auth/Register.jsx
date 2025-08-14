import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { registerSchema } from "../../utils/validations";
import { toast, ToastContainer } from "react-toastify";


const Register = () => {
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/register`,
        values
      );
      toast.success(data.message);
      resetForm();
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      toast.error(error.response?.data?.error || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-semibold text-center mb-4">Register</h2>

        <Formik
          initialValues={{
            firstname: "",
            lastname: "",
            email: "",
            password: "",
          }}
          validationSchema={registerSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              {["firstname", "lastname", "email", "password"].map((field) => (
                <div key={field}>
                  <Field
                    type={
                      field === "password"
                        ? "password"
                        : field === "email"
                        ? "email"
                        : "text"
                    }
                    name={field}
                    placeholder={
                      field[0].toUpperCase() +
                      field.slice(1).replace("name", " Name")
                    }
                    className="w-full p-2 border rounded-md"
                  />
                  <ErrorMessage
                    name={field}
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition"
              >
                {isSubmitting ? "Registering..." : "Register"}
              </button>
            </Form>
          )}
        </Formik>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </div>

      {/* Toast container */}
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Register;  