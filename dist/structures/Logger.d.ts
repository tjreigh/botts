export declare enum LogLevel {
    Error = 0,
    Warning = 1,
    Info = 2,
    Debug = 3,
    Verbose = 4
}
declare type LevelStrings = keyof typeof LogLevel;
export declare class Logger {
    constructor(level?: LogLevel);
    level: LogLevel;
    private colors;
    emit(message: any, level?: LevelStrings | LogLevel): void;
}
export {};
