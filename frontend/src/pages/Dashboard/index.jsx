import { useState, useEffect } from "react";
import api from "../../utils/axiosInstance";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [late, setLate] = useState(0);

  useEffect(() => {
    if (!user) return;

    api
      .get(`/dashboard/punctuality?startDate=2025-11-01&endDate=2025-11-13`)
      .then((res) => {
        setLate(res.data.totalTelat ?? 0);
        // setLate(4200);
      })
      .catch((error) => console.error(error));
  }, [user]);

  const lateHours = Math.floor(late / 60);
  const minutes = late % 60;
  const formattedLate =
    lateHours > 0 ? `${lateHours}h ${minutes}m` : `${minutes}m`;

  const maxHours = 8;
  const progress = Math.min(lateHours / maxHours, 1);

  const getColor = () => {
    if (late === 0) return "#86efac";
    if (lateHours < 6) return "#fcd34d";
    if (lateHours >= 6) return "#ef4444";

    const red = Math.floor((lateHours / 6) * 255);
    const green = Math.floor(255 - (lateHours / 6) * 255);
    return `rgb(${red},${green},0)`;
  };

  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <>
      {/* <div className="flex flex-1 justify-between h-screen mt-5 ml-2 lg:ml-0 rounded-xl shadow-md bg-green-200"> */}
      <div className=" rounded-xl bg-sky-200">sisa cuti: </div>
      <div className="items-center rounded-xl h-1/3 md:h-1/3 p-2 text-sm bg-slate-100">
        Total time late (this month): <br />
        <span className="text-2xl self-center">{late} minutes</span>
        <svg height={radius * 2} width={radius * 2} className="mx-auto mt-4">
          <circle
            stroke="#ddd"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={getColor()}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{
              strokeDashoffset,
              transition: "stroke-dashoffset 0.5s ease",
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
            transform={`rotate(-90 ${radius} ${radius})`}
          />
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            className="text-xl font-bold"
          >
            {formattedLate}
          </text>
        </svg>
      </div>
      {/* </div> */}
    </>
  );
}
