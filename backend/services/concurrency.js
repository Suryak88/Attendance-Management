import { BusinessError } from "../errors/BusinessError.js";

let activeJobs = 0;
const MAX_CONCURRENT = 2;

export async function runWithLimit(fn) {
  if (activeJobs >= MAX_CONCURRENT) {
    throw new BusinessError(
      "SERVER_BUSY",
      "Server sedang sibuk, silakan coba beberapa saat lagi",
    );
  }

  activeJobs++;
  // optional debug
  console.log("Active jobs:", activeJobs);

  try {
    const result = await fn();
    return result;
  } finally {
    activeJobs--;
    console.log("Job selesai. Active jobs:", activeJobs);
  }
}
