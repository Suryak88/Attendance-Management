export default function BtnLoading({ label }) {
  const radius = 8;
  const stroke = 3;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const dash = circumference * 0.75;

  return (
    <div className="flex w-full items-center justify-around">
      {label}
      <svg height={radius * 2} width={radius * 2} className="animate-spin">
        <circle
          className="text-sky-200"
          stroke={"currentColor"}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className="text-blue-400"
          stroke={"currentColor"}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={0}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </svg>
    </div>
  );
}
