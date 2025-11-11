import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const location = useLocation();

  // Mock check authentication - thực tế sẽ lấy từ context/redux
  const isAuthenticated = () => {
    return localStorage.getItem("token") !== null;
  };

  if (!isAuthenticated()) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
