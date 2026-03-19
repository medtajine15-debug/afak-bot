export function getCurrentTime(): string {
    return new Date().toLocaleString();
}

export const getCurrentTimeDefinition = {
    type: "function",
    function: {
        name: "get_current_time",
        description: "Returns the current local date and time.",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    }
};
