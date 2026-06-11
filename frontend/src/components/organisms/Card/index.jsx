export default function Card({ children }) {
  return (
    <>
      <div className="w-full max-w-xs bg-slate-100 outline outline-slate-300 shadow-md rounded-xl p-3">
        {children}
      </div>
    </>
  );
}
