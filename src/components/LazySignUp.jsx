import React, { Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
const SignUp = React.lazy(() => import("../pages/SignUp"));
const LazySignUp = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin h-8 w-8" />
        </div>
      }
    >
      <SignUp />
    </Suspense>
  );
};
export default LazySignUp;
