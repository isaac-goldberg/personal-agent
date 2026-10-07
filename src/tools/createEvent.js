import google from "../../google.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const cache = new Set();

const t = new DynamicStructuredTool({
    name: "create_event",
    description: "This tool creates an event in Google Calendar. Only call this tool ONCE.",
    schema: z.object({
        summary: z.string().describe("A summary of the event."),
        location: z.string().describe("An optional location for the event.").optional(),
        startTime: z.string().describe("A datetime representing the date and time when the event starts, using the ISO 8601 format (e.g., YYYY-MM-DDTHH:MM:SS)."),
        endTime: z.string().describe("A datetime representing the date and time when the event ends, using the ISO 8601 format (e.g., YYYY-MM-DDTHH:MM:SS). If the user doesn't specify an end time, default to one hour after the start time."),
    }),
    func: async ({ summary, location, startTime, endTime }) => {
        if (!cache.has(summary)) {
            cache.add(summary);
            console.log(summary)
            console.log(location)
            console.log(startTime)
            console.log(endTime)

            google.createCalenderEvent(summary, location, startTime, endTime);
        }

        return "create_event tool was successfully executed. Do not call this tool again. Generate a final answer for the user now."
    }
})
export default t;