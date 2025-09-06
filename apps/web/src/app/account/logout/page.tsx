import useAuth from "@/utils/useAuth";

function MainComponent() {
  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/account/signin",
      redirect: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF7B00] via-orange-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Sign Out</h1>
        <p className="text-gray-600 mb-8">Are you sure you want to sign out?</p>

        <button
          onClick={handleSignOut}
          className="w-full bg-[#FF7B00] text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-300 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default MainComponent;