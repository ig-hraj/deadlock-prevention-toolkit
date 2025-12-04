# deadlock_toolkit.py

class DeadlockToolkit:
    def __init__(self, n, m):
        self.n = n  # number of processes
        self.m = m  # number of resource types

        # Matrices and vectors
        self.max_need = [[0] * m for _ in range(n)]  # Max matrix
        self.alloc = [[0] * m for _ in range(n)]     # Allocation matrix
        self.need = [[0] * m for _ in range(n)]      # Need matrix
        self.avail = [0] * m                         # Available vector
        self.total = [0] * m                         # Total resources vector

    def update_need(self):
        """Recalculate Need = Max - Allocation."""
        for i in range(self.n):
            for j in range(self.m):
                self.need[i][j] = self.max_need[i][j] - self.alloc[i][j]

    def update_available_from_total(self):
        """Compute Available = Total - sum(Allocation column-wise)."""
        allocated_sum = [0] * self.m
        for j in range(self.m):
            col_sum = 0
            for i in range(self.n):
                col_sum += self.alloc[i][j]
            allocated_sum[j] = col_sum

        self.avail = [self.total[j] - allocated_sum[j] for j in range(self.m)]

    def is_safe(self):
        """Banker's safety algorithm. Returns (is_safe, safe_sequence)."""
        work = self.avail[:]
        finish = [False] * self.n
        safe_seq = []

        while len(safe_seq) < self.n:
            found = False
            for i in range(self.n):
                if not finish[i]:
                    can_finish = True
                    for j in range(self.m):
                        if self.need[i][j] > work[j]:
                            can_finish = False
                            break
                    if can_finish:
                        for j in range(self.m):
                            work[j] += self.alloc[i][j]
                        finish[i] = True
                        safe_seq.append(i)
                        found = True
            if not found:
                break

        return all(finish), safe_seq

    def request_resources(self, pid, req):
        """Banker's resource request algorithm."""
        if pid < 0 or pid >= self.n:
            return False, "Invalid process ID."

        # Request <= Need ?
        for j in range(self.m):
            if req[j] > self.need[pid][j]:
                return False, "Request exceeds process max claim."

        # Request <= Available ?
        for j in range(self.m):
            if req[j] > self.avail[j]:
                return False, "Resources unavailable. Process must wait."

        # Tentative allocation
        for j in range(self.m):
            self.avail[j] -= req[j]
            self.alloc[pid][j] += req[j]
            self.need[pid][j] -= req[j]

        safe, seq = self.is_safe()
        if safe:
            msg = "Request granted. Safe sequence: " + " -> ".join(f"P{p}" for p in seq)
            return True, msg
        else:
            # Rollback
            for j in range(self.m):
                self.avail[j] += req[j]
                self.alloc[pid][j] -= req[j]
                self.need[pid][j] += req[j]
            return False, "Request would lead to UNSAFE state. Rolled back."

    def detect_deadlock(self):
        """Deadlock detection using the same safety logic."""
        safe, seq = self.is_safe()
        if safe:
            return []
        all_procs = set(range(self.n))
        deadlocked = list(all_procs - set(seq))
        return deadlocked

    def recover(self):
        """Deadlock recovery by aborting a victim process."""
        deadlocked = self.detect_deadlock()
        if not deadlocked:
            return None, "No deadlock detected. No recovery needed."

        # Victim selection: process with maximum allocated resources
        victim = None
        max_alloc_sum = -1
        for p in deadlocked:
            s = sum(self.alloc[p])
            if s > max_alloc_sum:
                max_alloc_sum = s
                victim = p

        # Release victim resources
        for j in range(self.m):
            self.avail[j] += self.alloc[victim][j]
            self.alloc[victim][j] = 0
            self.need[victim][j] = self.max_need[victim][j]

        return victim, f"Aborted P{victim}. Resources released."

    def build_wait_for_graph(self):
        """
        Build wait-for graph as adjacency list:
        { process_i: [list_of_processes_it_waits_for] }
        """
        graph = {i: set() for i in range(self.n)}

        for i in range(self.n):
            for j in range(self.m):
                # If Pi still needs resource j and no instance of j is available
                if self.need[i][j] > 0 and self.avail[j] == 0:
                    # Then Pi might be waiting for some process that holds j
                    for k in range(self.n):
                        if self.alloc[k][j] > 0 and k != i:
                            graph[i].add(k)

        # Convert sets to lists for JSON-serializable output
        return {k: list(v) for k, v in graph.items()}
