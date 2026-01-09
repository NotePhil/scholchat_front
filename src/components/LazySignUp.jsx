import React, { Suspense } from 'react';
import { Loader } from 'lucide-react';

const SignUp = React.lazy(() => import('../pages/SignUp'));

const LazySignUp = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin h-8 w-8" />
      </div>
    }>
      <SignUp />
    </Suspense>
  );
};

export default LazySignUp;