export default function Correction() {
  return (
    <>
      <div className="bg-slate-100 flex flex-1 flex-col p-0.5 min-h-0">
        <div className="p-3 font-normal">
          <h3 className="text-xl font-semibold">Attendance Correction</h3>
        </div>
        <div className="shadow-md bg-slate-200 mx-4 p-2 rounded-lg">
          <form action="" className="space-y-5">
            <div className="">
              <label className="block font-medium mb-1">
                Correction Period
              </label>
              <div className="flex gap-3">
                <div className="flex flex-col flex-1">
                  <label htmlFor="startDate">From</label>
                  <input
                    type="date"
                    className="border rounded-md p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label htmlFor="endDate">To</label>
                  <input
                    type="date"
                    className="border rounded-md p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  />
                </div>
              </div>
            </div>
            <div className="">
              <label htmlFor="leaveType" className="block font-medium mb-1">
                Leave type
              </label>
              <select
                name="leaveType"
                id="leaveType"
                className="border rounded-md p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              >
                <option>Sakit</option>
                <option>Izin</option>
                <option>Cuti</option>
                <option>Lainnya</option>
              </select>
            </div>
            <div>
              <label htmlFor="reason" className="block font-medium mb-1">
                Reason
              </label>
              <textarea
                name="reason"
                id="reason"
                placeholder="Covid 19"
                className="border rounded-md p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none"
              ></textarea>
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium shadow-sm transition"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
