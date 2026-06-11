export default function FormContent({ onSubmit, children }) {
  return (
    <form
      className="mb-6 flex flex-col justify-center items-center my-auto w-full transition-all duration-300"
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}
