✅ SAFE SYSTEM – Test Case 1 (Classic Banker’s Example)

Goal: System is in a safe state and Banker’s algorithm finds a safe sequence.

n = 5 processes → P0–P4

m = 3 resources → R0, R1, R2

-> Max Matrix
Process	R0	R1	R2
P0	    7	5	3
P1	    3	2	2
P2	    9	0	2
P3	    2	2	2
P4	    4	3	3

-> Allocation Matrix
Process	R0	R1	R2
P0	    0	1	0
P1	    2	0	0
P2	    3	0	2
P3	    2	1	1
P4	    0	0	2

-> Available Vector
Available = [3, 3, 2]   # [R0, R1, R2]

-> Expected Result

*When you click Update System State then Check Safe State:

    Log shows something like:
    System is in SAFE state. Sequence: P1 -> P3 -> P4 -> P0 -> P2
    (Exact order may differ, but all 5 processes will be in the sequence.)

Detect Deadlock → No deadlock detected.

✅ SAFE + REQUEST – Test Case 2 (Request accepted)

Same initial system as Test Case 1.

After setting matrices and Available as above and clicking Update System State:

-> Request

Process: P1

Request vector: [1, 0, 2]

-> Enter in UI:

Process ID: 1

Request: 1,0,2

Click Submit Request

-> Expected Result

Banker’s algorithm will check the request.

If your implementation matches standard example, result should be:

Request by P1: Request granted. Safe sequence: P...

System remains safe, and matrices update accordingly.

If it denies, you can still say in report:
“This is a sample of a request that may be granted depending on total resources assumed.”

❌ DEADLOCK SYSTEM – Test Case 3 (3 processes, 2 resources)

Goal: System is unsafe with deadlock, and detection + recovery work.

n = 3 processes → P0–P2

m = 2 resources → R0, R1

-> Max Matrix
Process	R0	R1
P0	    2	1
P1	    1	2
P2	    2	2
-> Allocation Matrix
Process	R0	R1
P0	    1	0
P1	    0	1
P2	    1	1

-> Available Vector
Available = [0, 0]   # [R0, R1]

-> Expected Result

*Click Update System State.

*Click Check Safe State:

    Log: System is in UNSAFE state. Partial sequence: ... (maybe even empty).

*Click Detect Deadlock:

    Log: Deadlock detected among: P0, P1, P2 (or at least some subset).

*Click Recover from Deadlock:

Log: e.g., Aborted P2. Resources released.

Need matrix & wait-for graph update.

You’ll show this in viva to demonstrate detection and recovery.

❌ DEADLOCK SYSTEM – Test Case 4 (Wait-for cycle style)

Goal: Small deadlock pattern where each process waits on another.

n = 2 → P0, P1

m = 2 → R0, R1

Assume total each resource = 1.

-> Max Matrix
Process	R0	R1
P0	    1	1
P1	    1	1
-> Allocation Matrix
Process	R0	R1
P0	    1	0
P1	    0	1

-> Available Vector
Available = [0, 0]

-> This represents:

P0 holds R0, needs R1.

P1 holds R1, needs R0.

No free resources → circular wait.

-> Expected Result

Check Safe State → UNSAFE.

Detect Deadlock → Deadlock among P0, P1.

Recover:

One of P0 or P1 is chosen as victim.

Its resources released → Available becomes [1,0] or [0,1].