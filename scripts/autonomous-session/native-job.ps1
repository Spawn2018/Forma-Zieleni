$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
try {
    # Join a non-breakaway job before launching any executor. Windows closes the job
    # on supervisor exit, terminating every remaining descendant, even on hard kill.
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class NativeSessionJob {
    [StructLayout(LayoutKind.Sequential)] struct Basic {
        public long ProcessTime, JobTime;
        public uint Flags;
        public UIntPtr MinWorkingSet, MaxWorkingSet;
        public uint ActiveProcessLimit;
        public UIntPtr Affinity;
        public uint PriorityClass, SchedulingClass;
    }
    [StructLayout(LayoutKind.Sequential)] struct IO {
        public ulong ReadOps, WriteOps, OtherOps, ReadBytes, WriteBytes, OtherBytes;
    }
    [StructLayout(LayoutKind.Sequential)] struct Extended {
        public Basic Basic;
        public IO IO;
        public UIntPtr ProcessMemory, JobMemory, PeakProcessMemory, PeakJobMemory;
    }
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
    static extern IntPtr CreateJobObject(IntPtr attributes, string name);
    [DllImport("kernel32.dll", SetLastError=true)]
    static extern bool SetInformationJobObject(IntPtr job, int infoClass, ref Extended info, uint size);
    [DllImport("kernel32.dll", SetLastError=true)]
    static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
    [DllImport("kernel32.dll")] static extern IntPtr GetCurrentProcess();
    public static IntPtr Start() {
        var job = CreateJobObject(IntPtr.Zero, null);
        var limits = new Extended();
        limits.Basic.Flags = 0x2000; // JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE; no BREAKAWAY_OK.
        if (job == IntPtr.Zero || !SetInformationJobObject(job, 9, ref limits, (uint)Marshal.SizeOf<Extended>()) ||
            !AssignProcessToJobObject(job, GetCurrentProcess())) throw new InvalidOperationException("JOB_SETUP_FAILED");
        return job;
    }
}
'@
    $nativeJobHandle = [NativeSessionJob]::Start()
    $requestLine = [Console]::In.ReadLine()
    if ($null -eq $requestLine -or $requestLine.Length -gt 65536) { throw 'INVALID_REQUEST' }
    $request = $requestLine | ConvertFrom-Json
    $start = [System.Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $request.executable
    $start.WorkingDirectory = $request.cwd
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardInput = $true
    $start.StandardInputEncoding = [System.Text.UTF8Encoding]::new($false)
    $start.Environment.Clear()
    foreach ($entry in $request.env.PSObject.Properties) { $start.Environment[$entry.Name] = [string]$entry.Value }
    foreach ($argument in $request.arguments) { $start.ArgumentList.Add([string]$argument) }
    $child = [System.Diagnostics.Process]::Start($start)
    [Console]::Error.WriteLine('NATIVE_SUPERVISOR_READY')
    $child.StandardInput.Write([string]$request.input)
    $child.StandardInput.Close()
    $child.WaitForExit()
    exit $child.ExitCode
} catch {
    [Console]::Error.WriteLine('NATIVE_SUPERVISOR_FAILED')
    exit 125
}
