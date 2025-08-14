import { useState } from "react";
import { useFormik } from "formik";
import { loginSchema } from "../../utils/validations";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../features/auth/authSlice";
import { toast, ToastContainer } from "react-toastify";
import logo from "../../assets/dark.png";
 
const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
 
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setLoading(true);
 
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/api/auth/login`,
          values,
          { withCredentials: true }
        );
        if (response.data.result.user.role === "admin") {
          const { token, user } = response.data.result;
          dispatch(setCredentials({ token, userId: user.id }));
          navigate("/dashboard");
        } else {
          toast.success("Invalid Credientials");
        }
      } catch (error) {
         toast.error(error.response?.data?.message || "Login failed.");
        console.log(error, "errror");
      } finally {
        setLoading(false);
      }
    },
  });
 
  return (
    <div className="flex justify-center flex-col items-center min-h-screen bg-[#E9ECEF]">
      <img src={logo} className="w-[22%] mb-5" />
      <div className="bg-white p-6 rounded-lg shadow-md w-96 ">
        <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>
 
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full p-2 border rounded-md"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-sm">{formik.errors.email}</p>
            )}
          </div>
 
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full p-2 border rounded-md"
            />
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-sm">{formik.errors.password}</p>
            )}
          </div>
 
          <button
            type="submit"
            disabled={loading}
            className="w-full  text-white p-2 rounded-md bg-[#f76a00] hover:bg-[#db6613] transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
 
      {/* Toast notifications */}
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};
 
export default Login;