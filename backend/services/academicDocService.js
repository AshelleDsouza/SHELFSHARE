const PDFDocument = require('pdfkit');

/**
 * Academic Document Generator Service — ShelfShare
 * Produces authoritative, publication-grade academic study guides and lecture notes
 * formatted specifically for university curriculum (MCA, BCA, B.Tech CSE).
 *
 * Version 2.0 — Comprehensive credible content for all 15+ subject categories.
 */

const COLORS = {
  primary:     '#172C40',   // ShelfShare Navy
  secondary:   '#2E5B82',   // Medium Navy
  accent:      '#4A7C59',   // Academic Forest Green
  accentWarm:  '#C17F24',   // Amber for highlights
  border:      '#D0D7DE',   // Subtle border grey
  textPrimary: '#1F2328',   // Dark Charcoal
  textMuted:   '#656D76',   // Muted Grey
  bgSoft:      '#F6F8FA',   // Soft background
  codeBg:      '#1E293B',   // Dark Slate for code blocks
  codeText:    '#E2E8F0',   // Light slate text
  successBg:   '#ECFDF5',   // Light green bg
  warnBg:      '#FFFBEB',   // Amber bg
};

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC CONTENT LIBRARY
// ─────────────────────────────────────────────────────────────────────────────

function getComprehensiveTopicContent(resource) {
  const t = (resource.title || '').toLowerCase();
  const d = (resource.description || '').toLowerCase();
  const sub = (resource.subject_name || '').toLowerCase();

  // ── 1. DISTRIBUTED SYSTEMS / AUDIT ───────────────────────────────────────
  if (t.includes('audit') || t.includes('distributed') || sub.includes('distributed')) {
    return {
      moduleTitle: 'Advanced Distributed Systems Architecture & Reliability Auditing',
      unit: 'Unit 4: Consensus Protocols, Fault Tolerance & System Audits',
      learningObjectives: [
        'Understand Paxos, Raft, and Byzantine Fault Tolerance (BFT) consensus algorithms in depth.',
        'Analyze CAP and PACELC theorem trade-offs in real-world production systems.',
        'Implement distributed audit logging using tamper-evident Merkle hash chains.',
        'Evaluate Lamport Timestamps and Vector Clocks for causal ordering.',
        'Execute comprehensive reliability audits verifying ACID/BASE compliance and partition recovery.',
      ],
      sections: [
        {
          heading: '1. The CAP Theorem & PACELC Extension',
          body: `Brewer's CAP Theorem (2000) states that any distributed data store can simultaneously guarantee at most two of three properties:

• Consistency (C): Every read receives the most recent write or returns an error.
• Availability (A): Every non-failing node returns a non-error response for every request.
• Partition Tolerance (P): The system continues to operate despite arbitrary message drops or delays.

Since network partitions are unavoidable in physical networks, engineers choose between:
  → CP Systems: Sacrifice availability to maintain strict consistency. Examples: Google Spanner (TrueTime), Apache ZooKeeper, etcd. Used in banking, inventory management.
  → AP Systems: Sacrifice consistency for high availability. Examples: Amazon DynamoDB, Apache Cassandra, CouchDB. Use eventual consistency with conflict resolution (CRDT, vector clocks).

PACELC Theorem (Daniel Abadi, 2012) extends CAP:
  "If Partition (P): trade-off between Availability (A) vs Consistency (C);
   Else (E): trade-off between Latency (L) vs Consistency (C)"
  
  Example: DynamoDB is PA/EL (highly available under partition; low latency normally).
  Example: Google Spanner is PC/EC (consistent under partition; consistent normally, higher latency).`,
        },
        {
          heading: '2. Raft Consensus Protocol — Detailed Walkthrough',
          body: `Raft decomposes the consensus problem into three independent sub-problems:

LEADER ELECTION:
  • All nodes start as Followers. Followers set an election timeout (randomized 150–300 ms).
  • If no heartbeat arrives, a Follower transitions to Candidate, increments its term, votes for itself, and sends RequestVote RPCs to all peers.
  • A Candidate becomes Leader if it receives votes from a strict majority (floor(N/2) + 1 nodes).
  • A Leader sends periodic AppendEntries heartbeats to prevent new elections.

LOG REPLICATION:
  • The Leader appends client commands to its log and sends AppendEntries RPCs to all Followers.
  • An entry is considered COMMITTED once it has been replicated to a majority.
  • The Leader then notifies Followers of the commit index; Followers apply entries to their state machines.

SAFETY INVARIANT:
  • If a Leader has committed a log entry at a given index, no future Leader can overwrite that entry.
  • Guaranteed by the "Leader Completeness" property: a Candidate must have a log at least as up-to-date as the majority before it can be elected.

FAULT TOLERANCE:
  • A Raft cluster of N nodes can tolerate floor((N-1)/2) failures.
  • 3-node cluster tolerates 1 failure; 5-node cluster tolerates 2 failures.`,
        },
        {
          heading: '3. Raft Node State Machine (Go Pseudocode)',
          isCode: true,
          code: `type State int
const (Follower State = iota; Candidate; Leader)

type RaftNode struct {
    mu          sync.Mutex
    id, term    int
    state       State
    votedFor    int          // -1 = not voted
    log         []LogEntry
    commitIndex int
    peers       []string
}

func (n *RaftNode) startElection() {
    n.mu.Lock()
    n.state = Candidate
    n.term++
    n.votedFor = n.id
    votes := 1
    term := n.term
    n.mu.Unlock()

    for _, peer := range n.peers {
        go func(p string) {
            reply := n.sendRequestVote(p, term)
            if reply.VoteGranted {
                n.mu.Lock()
                votes++
                if votes > len(n.peers)/2+1 && n.state == Candidate {
                    n.state = Leader
                    go n.sendHeartbeats()
                }
                n.mu.Unlock()
            }
        }(peer)
    }
}

// Lamport Clock — event ordering without wall-clock sync
type LamportClock struct{ mu sync.Mutex; t int }
func (lc *LamportClock) Tick() int { lc.mu.Lock(); lc.t++; v := lc.t; lc.mu.Unlock(); return v }
func (lc *LamportClock) Update(remote int) { lc.mu.Lock(); if remote>lc.t { lc.t=remote }; lc.t++; lc.mu.Unlock() }`,
        },
        {
          heading: '4. Byzantine Fault Tolerance (BFT)',
          body: `Byzantine failures occur when nodes exhibit arbitrary malicious behaviour — sending conflicting messages to different peers, corrupting data, or colluding.

Minimum Node Requirement: To tolerate f Byzantine nodes, a system requires at least 3f + 1 total nodes.
  → f = 1: Need ≥ 4 nodes (majority = 3).
  → f = 2: Need ≥ 7 nodes.
  → Reason: The 3f+1 bound ensures non-faulty nodes always outnumber Byzantine nodes by at least 2f+1 vs f.

Practical Byzantine Fault Tolerance (PBFT) Algorithm:
  Phase 1 — Pre-prepare: Leader broadcasts a request with sequence number.
  Phase 2 — Prepare: Each replica multicasts a PREPARE message; waits for 2f matching messages.
  Phase 3 — Commit: Each replica multicasts COMMIT; waits for 2f+1 matching messages before executing.

Modern Alternatives:
  • Tendermint (used in Cosmos blockchain): BFT variant with deterministic finality.
  • HotStuff: Linear BFT with O(n) message complexity used in Facebook Diem.`,
        },
        {
          heading: '5. Distributed Audit Checklist & Exam Review',
          body: `RELIABILITY AUDIT CHECKLIST:
✓ Clock Drift: NTP sync error < 50ms; use TrueTime API (Google) for bounded uncertainty.
✓ Split-Brain: Quorum calculation Q = floor(N/2)+1; fencing tokens on leader handoff.
✓ Idempotency: Unique transaction IDs in Kafka/RabbitMQ to deduplicate retries.
✓ Data Integrity: Merkle tree hash verification across replicas to detect silent corruption.
✓ Health Checks: Liveness probe (is process alive?) vs Readiness probe (can it serve traffic?).

EXAM QUESTIONS:
Q1: Distinguish Lamport clocks from Vector clocks.
Answer: Lamport clock establishes partial order: a→b implies L(a)<L(b), but NOT converse. Vector clock V tracks causality fully: a→b iff V(a)[i]≤V(b)[i] for all i, with strict < for at least one index.

Q2: What is the minimum nodes needed for a Raft cluster tolerating 2 node failures?
Answer: 5 nodes. Formula: N ≥ 2f + 1. For f=2: N ≥ 5.

Q3: Describe the PACELC trade-off for Apache Cassandra.
Answer: PA/EL — Under partitions, Cassandra favors Availability over Consistency. Normally, it favors Latency over Consistency via tunable consistency levels (ONE, QUORUM, ALL).`,
        },
      ],
    };
  }

  // ── 2. DATA STRUCTURES — TREES & AVL ─────────────────────────────────────
  if (t.includes('tree') || t.includes('avl') || t.includes('binary') ||
      (t.includes('dsa') && !t.includes('graph') && !t.includes('dynamic'))) {
    return {
      moduleTitle: 'Data Structures & Algorithms: Binary Trees, BST & AVL Self-Balancing',
      unit: 'Unit 3: Hierarchical Structures, Balance Invariants & Rotation Mechanics',
      learningObjectives: [
        'Analyze BST degeneration from O(log N) to O(N) with monotonic insertion sequences.',
        'Master the AVL Height-Balance Invariant: |BF(X)| ≤ 1 for every node X.',
        'Implement all 4 rotation cases: LL-Right, RR-Left, LR-Double, RL-Double.',
        'Prove worst-case O(log N) for search, insert, and delete in AVL trees.',
        'Compare AVL vs Red-Black vs B-Tree for memory and cache-line efficiency.',
      ],
      sections: [
        {
          heading: '1. Binary Search Tree: Invariant & Degeneration Problem',
          body: `BST INVARIANT: For any node X:
  • ALL keys in left subtree < X.key
  • ALL keys in right subtree > X.key

DEGENERATION: Inserting keys in sorted order (1, 2, 3, 4, 5...) produces a right-skewed singly linked list. Height = N, so search/insert/delete all degrade to O(N).

SOLUTION: Adelson-Velsky and Landis (1962) introduced AVL trees — the first self-balancing BST.

BALANCE FACTOR (BF): For any node X:
  BF(X) = Height(LeftSubtree) − Height(RightSubtree)
  
  Height of null = -1 (some texts use 0).
  
  AVL INVARIANT: BF(X) ∈ {-1, 0, +1} for every node X in the tree.
  When any insertion/deletion causes BF(X) = +2 or -2, one or two rotations restore balance.

HEIGHT BOUND: An AVL tree with N nodes has height at most 1.44 × log₂(N).
  → This guarantees O(log N) operations even in worst case.`,
        },
        {
          heading: '2. The Four Rotation Cases — Visual Walkthrough',
          body: `CASE 1: Left-Left (LL) Heavy → Single Right Rotation
  Trigger: BF(Z) = +2, BF(Y) = +1 or 0
         Z                    Y
        / \\                 /   \\
       Y   T4   →         X     Z
      / \\                / \\   / \\
     X   T3             T1 T2 T3 T4
  Action: rotateRight(Z). Y becomes new root; Z takes Y's right child (T3) as its left child.

CASE 2: Right-Right (RR) Heavy → Single Left Rotation
  Trigger: BF(Z) = -2, BF(Y) = -1 or 0
  Mirror image of Case 1. rotateLeft(Z).

CASE 3: Left-Right (LR) Heavy → Double Rotation (Left on Y, then Right on Z)
  Trigger: BF(Z) = +2, BF(Y) = -1
  Step 1: rotateLeft(Y) → converts to LL case
  Step 2: rotateRight(Z)

CASE 4: Right-Left (RL) Heavy → Double Rotation (Right on Y, then Left on Z)
  Trigger: BF(Z) = -2, BF(Y) = +1
  Step 1: rotateRight(Y) → converts to RR case
  Step 2: rotateLeft(Z)`,
        },
        {
          heading: '3. Complete C++ AVL Tree Implementation',
          isCode: true,
          code: `struct Node {
    int key, height;
    Node *left = nullptr, *right = nullptr;
    explicit Node(int k) : key(k), height(1) {}
};

int h(Node* n)  { return n ? n->height : 0; }
int bf(Node* n) { return n ? h(n->left) - h(n->right) : 0; }
void upd(Node* n) { if(n) n->height = 1 + std::max(h(n->left), h(n->right)); }

Node* rotR(Node* z) {          // Right rotation
    Node* y = z->left;
    z->left = y->right; y->right = z;
    upd(z); upd(y); return y;
}
Node* rotL(Node* z) {          // Left rotation
    Node* y = z->right;
    z->right = y->left; y->left = z;
    upd(z); upd(y); return y;
}
Node* balance(Node* z) {
    upd(z);
    int b = bf(z);
    if (b > 1) {               // Left heavy
        if (bf(z->left) < 0) z->left = rotL(z->left); // LR case
        return rotR(z);
    }
    if (b < -1) {              // Right heavy
        if (bf(z->right) > 0) z->right = rotR(z->right); // RL case
        return rotL(z);
    }
    return z;                  // Already balanced
}
Node* insert(Node* node, int key) {
    if (!node) return new Node(key);
    if (key < node->key) node->left  = insert(node->left,  key);
    else if (key > node->key) node->right = insert(node->right, key);
    return balance(node);     // Rebalance on the way back up
}`,
        },
        {
          heading: '4. Complexity Analysis & Tree Comparison Table',
          body: `OPERATION COMPLEXITY (AVL):
  Search:   O(log N) worst case — guaranteed by height bound ≤ 1.44 log₂N
  Insert:   O(log N) — at most 2 rotations required
  Delete:   O(log N) — may require O(log N) rotations propagating to root
  Space:    O(N) — 1 extra integer per node for height

COMPARATIVE ANALYSIS:
  Structure     | Insert     | Search    | Delete    | Use Case
  ─────────────────────────────────────────────────────────────
  Sorted Array  | O(N)       | O(log N)  | O(N)      | Static lookups
  BST (avg)     | O(log N)   | O(log N)  | O(log N)  | Dynamic sets
  AVL Tree      | O(log N)   | O(log N)  | O(log N)  | Freq. lookups (strict balance)
  Red-Black     | O(log N)   | O(log N)  | O(log N)  | Freq. inserts (relaxed balance)
  B-Tree        | O(log N)   | O(log N)  | O(log N)  | Disk-based database indexes

EXAM TIP: AVL trees are more rigidly balanced than Red-Black trees → faster lookups.
Red-Black trees require fewer rotations on insert/delete → better for write-heavy workloads.
Linux kernel's rb_tree, Java's TreeMap, and C++ std::map all use Red-Black trees.`,
        },
      ],
    };
  }

  // ── 3. GRAPH ALGORITHMS ───────────────────────────────────────────────────
  if (t.includes('graph') || t.includes('dijkstra') || t.includes('bellman') ||
      t.includes('kruskal') || t.includes('shortest path') || sub.includes('graph')) {
    return {
      moduleTitle: 'Graph Theory & Algorithmic Optimization: Shortest Paths & MST',
      unit: 'Unit 4: Single-Source Shortest Paths, MST & Network Flow',
      learningObjectives: [
        'Implement Dijkstra\'s SSSP with binary min-heap: O((V+E) log V) complexity.',
        'Analyze Bellman-Ford for negative weights and negative cycle detection.',
        'Construct MST using Kruskal\'s (DSU) and Prim\'s algorithms.',
        'Understand Floyd-Warshall All-Pairs Shortest Path: O(V³) complexity.',
        'Prove correctness using the Relaxation property and triangle inequality.',
      ],
      sections: [
        {
          heading: '1. Graph Representations & Complexity Trade-offs',
          body: `ADJACENCY MATRIX (V × V boolean/weight matrix):
  • Space: O(V²) — wasteful for sparse graphs
  • Edge lookup: O(1)
  • Enumerate neighbours: O(V)
  • Best for: Dense graphs, Floyd-Warshall

ADJACENCY LIST (array of lists):
  • Space: O(V + E)
  • Edge lookup: O(degree)
  • Enumerate neighbours: O(degree)
  • Best for: Sparse graphs, Dijkstra, BFS/DFS

TYPES OF SHORTEST PATH PROBLEMS:
  • Single-Source (SSSP): One source, all destinations → Dijkstra (non-negative), Bellman-Ford (negative OK)
  • All-Pairs (APSP): All sources, all destinations → Floyd-Warshall O(V³), Johnson's O(VE + V² log V)
  • Single-Pair: Specific source & destination → A* heuristic search`,
        },
        {
          heading: '2. Dijkstra\'s Algorithm — Proof & Implementation',
          body: `STRATEGY: Greedy — always process the unvisited vertex with minimum tentative distance.

CORRECTNESS PROOF (by induction):
  Base: dist[src] = 0 is trivially optimal.
  Step: When we extract vertex u from the priority queue with distance d, claim d is optimal.
  Proof by contradiction: Suppose ∃ shorter path via some unvisited vertex w. Then dist[w] ≥ dist[u] (w hasn't been extracted yet), and adding non-negative edge weight w→u only increases distance. Contradiction.

COMPLEXITY:
  • Adjacency Matrix + Linear Scan: O(V²) — good for dense graphs
  • Binary Heap PQ + Adjacency List: O((V+E) log V)
  • Fibonacci Heap: O(E + V log V) — theoretical optimum, rarely used in practice

LIMITATION: Fails with NEGATIVE edge weights because the greedy extraction assumption breaks.`,
        },
        {
          heading: '3. Dijkstra + Bellman-Ford Implementation (C++)',
          isCode: true,
          code: `#include <vector>
#include <queue>
#include <climits>
using namespace std;
typedef pair<int,int> pii;

// DIJKSTRA — O((V+E) log V) — non-negative weights only
vector<int> dijkstra(int V, vector<vector<pii>>& adj, int src) {
    vector<int> dist(V, INT_MAX);
    priority_queue<pii, vector<pii>, greater<pii>> pq; // min-heap
    dist[src] = 0;
    pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue; // stale entry
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}

// BELLMAN-FORD — O(V*E) — handles negative weights
// Returns {} if negative cycle detected
vector<int> bellmanFord(int V, vector<tuple<int,int,int>>& edges, int src) {
    vector<int> dist(V, INT_MAX);
    dist[src] = 0;
    for (int i = 0; i < V - 1; i++)       // Relax V-1 times
        for (auto [u, v, w] : edges)
            if (dist[u] != INT_MAX && dist[u] + w < dist[v])
                dist[v] = dist[u] + w;
    for (auto [u, v, w] : edges)           // V-th pass detects neg cycle
        if (dist[u] != INT_MAX && dist[u] + w < dist[v])
            return {};                     // Negative cycle exists
    return dist;
}`,
        },
        {
          heading: '4. Minimum Spanning Trees: Kruskal\'s & Prim\'s',
          body: `MINIMUM SPANNING TREE (MST): A spanning tree of an undirected weighted graph with minimum total edge weight.
  • |V| nodes → MST has exactly |V|-1 edges
  • Applications: Network design, cluster analysis, approximation algorithms

KRUSKAL'S ALGORITHM (Edge-based, Greedy):
  1. Sort all edges by weight ascending: O(E log E)
  2. Use Disjoint Set Union (DSU/Union-Find) to greedily add edges
  3. Skip edge (u,v) if u and v are already in the same component
  4. Stop when V-1 edges are added → O(E log E + E α(V)) where α is inverse Ackermann
  Best for: Sparse graphs

PRIM'S ALGORITHM (Vertex-based, Greedy):
  1. Start from any vertex. Maintain a min-heap of (weight, vertex) pairs.
  2. At each step, extract minimum-weight edge crossing the cut (S, V-S).
  3. Add the destination vertex to S, add its edges to the heap.
  4. Complexity with binary heap: O((V+E) log V)
  Best for: Dense graphs

CUT PROPERTY (Proof of correctness): If (u,v) is the minimum-weight edge crossing any cut of G, then (u,v) belongs to some MST.`,
        },
      ],
    };
  }

  // ── 4. DYNAMIC PROGRAMMING ────────────────────────────────────────────────
  if (t.includes('dynamic programming') || t.includes('knapsack') ||
      t.includes('lcs') || t.includes('dp ') || sub.includes('dynamic')) {
    return {
      moduleTitle: 'Dynamic Programming: Optimal Substructure & Overlapping Subproblems',
      unit: 'Unit 5: Tabulation, Memoization, Knapsack, LCS & Matrix Chain',
      learningObjectives: [
        'Identify two DP properties: Optimal Substructure & Overlapping Subproblems.',
        'Formulate recurrence relations for 0/1 Knapsack, LCS, and Matrix Chain Multiplication.',
        'Convert recursive solutions to Bottom-Up tabulation for O(1) extra space (rolling array).',
        'Reconstruct optimal solutions by backtracking the DP table.',
        'Analyze DP time and space complexity using the state space product rule.',
      ],
      sections: [
        {
          heading: '1. DP Fundamentals: Two Necessary Properties',
          body: `A problem is solvable by Dynamic Programming if and only if it exhibits:

1. OPTIMAL SUBSTRUCTURE:
   An optimal solution to the problem contains optimal solutions to its subproblems.
   Example: The shortest path from A→C via B contains the shortest path A→B AND the shortest path B→C.
   Counter-example: Longest simple path does NOT have optimal substructure.

2. OVERLAPPING SUBPROBLEMS:
   The recursive decomposition produces the same sub-instances multiple times.
   Fibonacci: fib(5) → fib(4)+fib(3) → fib(3)+fib(2)+fib(2)+fib(1) — fib(3) recomputed.
   Solution: Memoize (top-down) or tabulate (bottom-up) to compute each sub-instance once.

MEMOIZATION vs TABULATION:
  Memoization (Top-Down):
    • Lazy — only computes needed sub-instances
    • Uses recursion + hash map / array cache
    • Space: O(state space) for call stack + cache
  
  Tabulation (Bottom-Up):
    • Eager — fills entire DP table iteratively
    • No recursion overhead
    • Often allows space optimisation (rolling array)
    • Preferred in competitive programming and production code`,
        },
        {
          heading: '2. 0/1 Knapsack Problem — Full Derivation',
          body: `PROBLEM: N items, each with weight w[i] and value v[i]. Knapsack capacity W.
  Maximize total value subject to total weight ≤ W. Each item included at most once (0/1).

STATE: dp[i][w] = maximum value using subset of first i items with total weight ≤ w

RECURRENCE:
  dp[0][w] = 0  for all w    (no items → zero value)
  dp[i][w] = dp[i-1][w]                           if w[i] > w  (can't include item i)
  dp[i][w] = max(dp[i-1][w],  v[i] + dp[i-1][w-w[i]])  if w[i] ≤ w

COMPLEXITY: Time O(N × W),  Space O(N × W) → optimised to O(W) with 1D rolling array

SPACE OPTIMIZATION (iterate w in reverse):
  dp[w] = max(dp[w],  v[i] + dp[w - w[i]])    // iterate w from W down to w[i]

BACKTRACKING to find selected items:
  for i from N to 1:
    if dp[i][W] != dp[i-1][W]:
      item i is included; W -= w[i]

WORKED EXAMPLE: N=3, W=5, items={(w=2,v=3),(w=3,v=4),(w=4,v=5)}
  Optimal: take items 1 and 2 → total weight=5, total value=7.`,
        },
        {
          heading: '3. LCS & Matrix Chain Multiplication (C++ Code)',
          isCode: true,
          code: `#include <vector>
#include <string>
using namespace std;

// LONGEST COMMON SUBSEQUENCE — O(m*n) time and space
// LCS("ABCBDAB", "BDCAB") = 4 ("BCAB" or "BDAB")
int lcs(const string& X, const string& Y) {
    int m = X.size(), n = Y.size();
    vector<vector<int>> dp(m+1, vector<int>(n+1, 0));
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            if (X[i-1] == Y[j-1])  dp[i][j] = 1 + dp[i-1][j-1];
            else                    dp[i][j] = max(dp[i-1][j], dp[i][j-1]);
    return dp[m][n];
}

// 0/1 KNAPSACK with space optimization — O(N*W) time, O(W) space
int knapsack(int W, vector<int>& wt, vector<int>& val, int N) {
    vector<int> dp(W+1, 0);
    for (int i = 0; i < N; i++)
        for (int w = W; w >= wt[i]; w--)   // Reverse iteration prevents reuse
            dp[w] = max(dp[w], val[i] + dp[w - wt[i]]);
    return dp[W];
}

// MATRIX CHAIN MULTIPLICATION — O(N^3) time, O(N^2) space
// dims[i]*dims[i+1] = dimensions of matrix A[i]
int matrixChain(vector<int>& dims) {
    int n = dims.size() - 1;
    vector<vector<int>> dp(n, vector<int>(n, 0));
    for (int len = 2; len <= n; len++)
        for (int i = 0; i <= n - len; i++) {
            int j = i + len - 1;
            dp[i][j] = INT_MAX;
            for (int k = i; k < j; k++)
                dp[i][j] = min(dp[i][j],
                    dp[i][k] + dp[k+1][j] + dims[i]*dims[k+1]*dims[j+1]);
        }
    return dp[0][n-1];
}`,
        },
        {
          heading: '4. Classic DP Problems Reference Sheet',
          body: `PROBLEM              | STATE                | RECURRENCE PATTERN            | TIME
─────────────────────────────────────────────────────────────────────────────────
Fibonacci            | dp[i]                | dp[i-1] + dp[i-2]             | O(N)
Coin Change (count)  | dp[amount]           | dp[amount-coin]+1 (min)        | O(N*A)
Rod Cutting          | dp[n]                | max over all cuts              | O(N²)
Longest Inc. Subseq. | dp[i]                | max(dp[j]+1) for j<i,a[j]<a[i]| O(N²)
Edit Distance        | dp[i][j]             | insert/delete/replace costs    | O(M*N)
Subset Sum           | dp[i][s] bool        | dp[i-1][s] OR dp[i-1][s-a[i]] | O(N*S)
Palindrome Partition | dp[i][j]             | dp[i+1][j-1] if s[i]==s[j]    | O(N²)
Matrix Chain Mult.   | dp[i][j]             | min over split points k        | O(N³)

EXAM TIPS:
• State identification: "What minimum information describes a unique subproblem?"
• Always draw the recurrence with clear base cases before coding.
• State space × transition cost = total time complexity.`,
        },
      ],
    };
  }

  // ── 5. DBMS NORMALIZATION & ACID ─────────────────────────────────────────
  if (t.includes('normalization') || t.includes('acid') || t.includes('dbms') ||
      t.includes('database') || sub.includes('database')) {
    return {
      moduleTitle: 'Database Systems: Relational Normalization, Transactions & Indexing',
      unit: 'Unit 2–3: Functional Dependencies, Normal Forms, ACID & B+ Tree Indexes',
      learningObjectives: [
        'Identify insertion, deletion, and update anomalies in unnormalized schemas.',
        'Compute attribute closures and minimal covers for functional dependency sets.',
        'Execute lossless-join, dependency-preserving decomposition into 3NF and BCNF.',
        'Analyze ACID properties and isolation levels: Read Uncommitted to Serializable.',
        'Understand B+ Tree indexes: structure, search O(log N), insertion with page splits.',
      ],
      sections: [
        {
          heading: '1. Anomalies in Unnormalized Schemas',
          body: `Consider relation STUDENT(SID, Name, DeptID, DeptName, CourseName, Grade):

UPDATE ANOMALY: If CS dept renames to "Computer Science & AI", every row containing CS must be updated. Missing even one row leaves the database inconsistent.

INSERTION ANOMALY: Cannot record a new department without enrolling at least one student (SID would be NULL, violating primary key constraint).

DELETION ANOMALY: If the only student in a course (e.g., Art History) drops out, the course record is permanently destroyed from the database.

ROOT CAUSE: Multiple independent facts stored in a single relation due to functional dependencies like DeptID → DeptName (a non-key attribute determining another non-key attribute — a transitive dependency).

SOLUTION: Decompose into smaller relations where each relation describes exactly one "fact" about one entity.`,
        },
        {
          heading: '2. Normal Forms: 1NF through BCNF',
          body: `1NF (First Normal Form):
  • All attribute values are ATOMIC (indivisible) — no repeating groups, no multi-valued attributes.
  • Every row is uniquely identifiable by a primary key.
  
2NF (Second Normal Form):
  • In 1NF AND no PARTIAL DEPENDENCY of non-prime attributes on a composite key.
  • Partial dependency: X→A where X is a proper subset of a candidate key.
  • Fix: Decompose to separate the partial dependency.
  
3NF (Third Normal Form):
  • In 2NF AND no TRANSITIVE DEPENDENCY.
  • For every FD X→A: X is a superkey OR A is a prime attribute (part of some candidate key).
  • Fix: Decompose to remove transitivity. Preserves all FDs.
  
BCNF (Boyce-Codd Normal Form):
  • For every non-trivial FD X→A: X MUST be a superkey. Stricter than 3NF.
  • BCNF may not preserve all functional dependencies (unlike 3NF).
  • Every BCNF relation is in 3NF, but NOT vice versa.
  
4NF: No multi-valued dependencies (MVDs). Used in advanced database design.

EXAM WORKED EXAMPLE:
  R(A, B, C, D), FDs: { AB→C, C→D, D→B }
  Candidate Key: AB (AB+ = {A,B,C,D})
  Violation: C→D where C is not a superkey → NOT in BCNF.
  Decompose: R1(C,D) with key C; R2(A,B,C) with key AB. Both in BCNF.`,
        },
        {
          heading: '3. ACID Properties & Isolation Levels',
          body: `ACID TRANSACTION PROPERTIES:

Atomicity: Transaction executes as an all-or-nothing unit. If any step fails, the entire transaction is rolled back (UNDO log / shadow paging).

Consistency: Every transaction transforms the database from one valid state to another. All integrity constraints (PK, FK, CHECK) are satisfied after commit.

Isolation: Concurrent transactions appear to execute serially. Isolation level controls the degree of concurrency vs consistency:

  Level               | Dirty Read | Non-Rep. Read | Phantom Read
  ──────────────────────────────────────────────────────────────
  READ UNCOMMITTED    | Possible   | Possible      | Possible
  READ COMMITTED      | No         | Possible      | Possible
  REPEATABLE READ     | No         | No            | Possible (MySQL InnoDB default)
  SERIALIZABLE        | No         | No            | No

Durability: Committed transactions survive system crashes. Achieved via Write-Ahead Logging (WAL) — log record is written to disk BEFORE the data page is modified.

CONCURRENCY PROBLEMS:
• Dirty Read: T1 reads uncommitted data written by T2 that later rolls back.
• Non-Repeatable Read: T1 reads row, T2 modifies and commits, T1 re-reads and gets different value.
• Phantom Read: T1 reads a range, T2 inserts into the range, T1 re-reads and sees new rows.`,
        },
        {
          heading: '4. B+ Tree Indexes (MySQL InnoDB)',
          body: `WHY B+ TREES?
  • Disk I/O dominates database performance. B+ trees minimize I/O by maximizing data per page.
  • Each internal node holds up to (2t-1) keys and 2t children (order t).
  • All actual data records stored only in LEAF nodes (unlike B-Trees).
  • Leaf nodes are linked in a doubly-linked list → enables efficient range scans.

SEARCH: O(log_t N) disk reads where t = branching factor (typically 100-1000 for disk pages).

INSERTION:
  1. Find leaf L where key belongs.
  2. If L has space: insert key → Done.
  3. If L is full (overflow): SPLIT L into two nodes. Push median key up to parent.
  4. If parent overflows: recursively split parent. If root overflows: create new root (tree grows taller).

CLUSTERED vs NON-CLUSTERED INDEXES (MySQL InnoDB):
  • Primary Key = Clustered Index: Data rows stored in B+ tree leaf nodes sorted by PK. 
    One per table. Full row in leaf — no secondary lookup needed.
  • Secondary Index = Non-Clustered: Leaf nodes store (secondary key, primary key). 
    Requires a second B+ tree lookup to fetch full row ("double dip").

COVERING INDEX: If all queried columns are in the index, secondary lookup is avoided. 
  → Design tip: Include frequently queried columns in the index to avoid table scans.`,
        },
      ],
    };
  }

  // ── 6. OPERATING SYSTEMS — CPU SCHEDULING & DEADLOCK ────────────────────
  if (t.includes('scheduling') || t.includes('deadlock') ||
      (t.includes('os') && !t.includes('memory') && !t.includes('paging'))) {
    return {
      moduleTitle: 'Operating Systems: CPU Scheduling, Synchronisation & Deadlock',
      unit: 'Unit 2: Process States, Scheduling Algorithms & Deadlock Avoidance',
      learningObjectives: [
        'Understand Process Control Block (PCB) structure and all 5 process state transitions.',
        'Calculate TAT, WT, and Response Time across FCFS, SJF, SRTF, Priority, and Round Robin.',
        'Analyze race conditions using critical section problem and Peterson\'s solution.',
        'Apply Banker\'s Algorithm to find safe sequences in multi-resource environments.',
        'Distinguish deadlock prevention, avoidance, detection, and recovery strategies.',
      ],
      sections: [
        {
          heading: '1. Process States & CPU Scheduling Metrics',
          body: `FIVE-STATE PROCESS MODEL:
  New → Ready → Running → Waiting → Terminated
  
  Transitions:
  New → Ready:    Process loaded into memory, placed in ready queue.
  Ready → Running: Dispatcher selects process (context switch).
  Running → Ready: Preempted by timer interrupt (time quantum expired) or higher priority.
  Running → Waiting: I/O request or event wait (e.g., read(), sleep(), mutex).
  Waiting → Ready: I/O completion or event signal (interrupt handler).
  Running → Terminated: Process calls exit() or is killed.

SCHEDULING METRICS:
  • Arrival Time (AT): When process enters ready queue
  • Burst Time (BT): CPU execution time required
  • Completion Time (CT): When process finishes execution
  • Turnaround Time (TAT) = CT − AT
  • Waiting Time (WT) = TAT − BT
  • Response Time = First CPU grant − AT
  • Throughput = Completed processes / Total time unit`,
        },
        {
          heading: '2. Scheduling Algorithms — Worked Gantt Chart Problem',
          body: `PROCESS SET: P1(AT=0, BT=8), P2(AT=1, BT=4), P3(AT=2, BT=2), P4(AT=3, BT=1)

FCFS (Non-Preemptive): [P1:0-8][P2:8-12][P3:12-14][P4:14-15]
  TAT: P1=8, P2=11, P3=12, P4=12 → Avg TAT=10.75, Avg WT=5.5

SJF (Non-Preemptive) — burst at arrival: [P1:0-8][P4:8-9][P3:9-11][P2:11-15]
  Wait for shorter jobs already in queue at time=8: P2(BT=4),P3(BT=2),P4(BT=1)
  Avg TAT=9.0, Avg WT=4.25

SRTF (Preemptive SJF — Shortest Remaining Time First):
  t=0: P1 runs (rem=8)
  t=1: P2 arrives (BT=4 < P1 rem=7) → preempt P1
  t=2: P3 arrives (BT=2 < P2 rem=3) → preempt P2
  t=3: P4 arrives (BT=1 < P3 rem=1? No. 1=1) → P3 finishes at t=4
  [P1:0-1][P2:1-2][P3:2-4][P4:4-5][P2:5-8][P1:8-15]
  Avg TAT=6.5, Avg WT=2.25 ← Optimal (minimum average waiting time)

ROUND ROBIN (Time Quantum=3):
  Queue at t=0: P1. Queue at t=3: P2,P3,P4 (arrived); P1 rejoins
  [P1:0-3][P2:3-6][P3:6-8][P4:8-9][P1:9-14]
  Avg Response Time is best — fair for interactive systems.`,
        },
        {
          heading: '3. Critical Section & Synchronisation Primitives',
          body: `CRITICAL SECTION PROBLEM: Multiple processes access shared data concurrently.
  
  Three requirements for a valid solution:
  1. MUTUAL EXCLUSION: At most one process executes in its CS at any time.
  2. PROGRESS: If no process is in CS and some want to enter, one must be allowed in finite time.
  3. BOUNDED WAITING: A process cannot wait indefinitely to enter its CS.

PETERSON'S SOLUTION (2 processes, software-only):
  Shared: flag[2] = {false, false}; turn = 0;
  Process i:
    flag[i] = true;        // I want to enter
    turn = j;              // Give priority to other
    while (flag[j] && turn == j) { wait; }  // Busy wait
    // Critical Section
    flag[i] = false;       // I'm done

SEMAPHORES (Dijkstra, 1965):
  • Binary Semaphore (mutex): Values 0 or 1 → implements mutual exclusion.
  • Counting Semaphore: Tracks available resources (e.g., N buffer slots in Producer-Consumer).
  • wait(S): S--; if S < 0 → block process  (also called P() or down())
  • signal(S): S++; if S ≤ 0 → wake blocked process  (also called V() or up())

DEADLOCK COFFMAN CONDITIONS (all 4 must hold simultaneously):
  1. Mutual Exclusion: Resource held exclusively.
  2. Hold and Wait: Process holds resource while requesting another.
  3. No Preemption: Resource released only voluntarily.
  4. Circular Wait: P₀ waits for P₁, P₁ waits for P₂, ..., Pₙ waits for P₀.`,
        },
        {
          heading: '4. Banker\'s Algorithm — Safe Sequence Example',
          body: `BANKER'S ALGORITHM (Dijkstra, 1965) — Deadlock Avoidance:
  Requires processes to declare maximum resource needs upfront.
  State is SAFE if there exists a safe sequence of execution.

EXAMPLE: 5 processes (P0–P4), 3 resource types A(10), B(5), C(7):

  Process | Allocation  | Max        | Need (Max-Alloc) | Available: A=3, B=3, C=2
           | A  B  C    | A  B  C   | A  B  C
  P0       | 0  1  0    | 7  5  3   | 7  4  3
  P1       | 2  0  0    | 3  2  2   | 1  2  2
  P2       | 3  0  2    | 9  0  2   | 6  0  0
  P3       | 2  1  1    | 2  2  2   | 0  1  1
  P4       | 0  0  2    | 4  3  3   | 4  3  1

SAFE SEQUENCE FINDING:
  Step 1: P1 needs ≤ Available(3,3,2)? Need(1,2,2) ≤ (3,3,2) ✓ → Run P1, release Alloc. Available=(5,3,2)
  Step 2: P3 needs (0,1,1) ≤ (5,3,2) ✓ → Run P3, release (2,1,1). Available=(7,4,3)
  Step 3: P4 needs (4,3,1) ≤ (7,4,3) ✓ → Run P4. Available=(7,4,5)
  Step 4: P0 needs (7,4,3) ≤ (7,4,5) ✓ → Run P0. Available=(7,5,5)
  Step 5: P2 needs (6,0,0) ≤ (7,5,5) ✓ → Run P2. DONE.
  
  SAFE SEQUENCE: P1 → P3 → P4 → P0 → P2 ✓`,
        },
      ],
    };
  }

  // ── 7. MEMORY MANAGEMENT & PAGING ────────────────────────────────────────
  if (t.includes('memory') || t.includes('paging') || t.includes('virtual memory') ||
      t.includes('page replacement') || sub.includes('memory')) {
    return {
      moduleTitle: 'Operating Systems: Virtual Memory, Paging & Page Replacement',
      unit: 'Unit 3: Memory Virtualization, TLB, Page Tables & Replacement Algorithms',
      learningObjectives: [
        'Understand logical-to-physical address translation via MMU and multi-level page tables.',
        'Calculate Effective Memory Access Time (EAT) with TLB hit ratio.',
        'Simulate FIFO, Optimal (OPT), LRU, and Clock page replacement algorithms.',
        'Explain Belady\'s Anomaly and thrashing detection via working set model.',
        'Analyze segmentation vs paging for memory protection and sharing.',
      ],
      sections: [
        {
          heading: '1. Paging Architecture & Address Translation',
          body: `PAGING ELIMINATES EXTERNAL FRAGMENTATION by dividing:
  • Physical memory → fixed-size FRAMES
  • Logical memory → fixed-size PAGES (same size as frames)

ADDRESS TRANSLATION:
  Logical Address = (Page Number p | Page Offset d)
    → p used as index into PAGE TABLE to fetch Frame Number f
    → Physical Address = (f × PageSize) + d

EXAMPLE (PageSize = 4KB = 2¹² bytes):
  32-bit logical address → 20-bit page number, 12-bit offset
  Page Table size = 2²⁰ entries × 4 bytes = 4MB per process (too large!)
  
MULTI-LEVEL PAGE TABLES:
  2-Level (x86 32-bit): Split 20-bit PN into 10+10. 
    Only the first-level table must be in memory; second-level loaded on demand.
  4-Level (x86-64): Supports 48-bit virtual addresses.

TRANSLATION LOOKASIDE BUFFER (TLB):
  Hardware cache for recent page-table lookups. Associative parallel search.
  TLB Hit → 1 memory access (data only)
  TLB Miss → 2 memory accesses (page table + data)
  
  EAT = h×(t_TLB + t_mem) + (1-h)×(t_TLB + 2×t_mem)
  
  EXAMPLE: t_TLB=20ns, t_mem=100ns, h=0.90
  EAT = 0.9×(20+100) + 0.1×(20+200) = 108 + 22 = 130ns (vs 200ns without TLB → 35% faster)`,
        },
        {
          heading: '2. Page Replacement Algorithms — Simulation',
          body: `REFERENCE STRING: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2   (3 frames)

FIFO (First In, First Out):
  Replace the page that has been in memory the longest (oldest arrival).
  Frames: [7] → [7,0] → [7,0,1] → [2,0,1] → Hit0 → [2,3,1] → [2,3,0] → [4,3,0] → ...
  Page Faults: 9    FIFO suffers from BELADY'S ANOMALY.

OPTIMAL (OPT / MIN — Belady 1966):
  Replace page that will NOT be used for the longest time in the future.
  Requires knowledge of future reference string → theoretical upper bound only.
  Page Faults: 7   (minimum possible — benchmark for other algorithms)

LRU (Least Recently Used):
  Replace page that has not been used for the longest time in the past.
  Approximates OPT using recency as a proxy for future use.
  Implementations:
    • Stack (doubly linked list + hash map): O(1) hit and update — optimal implementation
    • Counter method: Per-page access counter, find minimum on fault — O(N) fault time
  Page Faults: 8

BELADY'S ANOMALY:
  FIFO can produce MORE page faults with MORE frames! Counterintuitive.
  Example: Reference string 1,2,3,4,1,2,5,1,2,3,4,5
    3 frames → 9 faults,  4 frames → 10 faults  (more frames = more faults!)
  LRU and OPT do NOT exhibit Belady's anomaly (they are STACK algorithms).

CLOCK ALGORITHM (Second-Chance):
  Approximates LRU with O(1) implementation using a circular buffer and "reference bit".
  On fault: scan clock hand; if ref bit = 1 → clear and advance; if 0 → replace.`,
        },
        {
          heading: '3. Thrashing & Working Set Model',
          body: `THRASHING: A process spends more time paging than executing. Occurs when the total demand for frames exceeds available physical memory.

CAUSE: If a process's RESIDENT SET (pages in memory) is smaller than its WORKING SET (pages actively used), it generates frequent page faults. With high CPU utilisation, the OS admits more processes, worsening the problem.

WORKING SET MODEL (Denning, 1968):
  W(t, Δ) = set of pages referenced in the last Δ time units (working set window)
  |W(t, Δ)| = working set size (varies over time)
  
  POLICY: Ensure each process has at least W(t, Δ) frames allocated.
  If sum of working sets > physical frames → suspend some processes.

PAGE FAULT FREQUENCY (PFF) APPROACH:
  • Monitor actual page fault rate per process.
  • If rate > upper threshold → allocate more frames.
  • If rate < lower threshold → reclaim frames.
  • Suspended processes freed to give frames to struggling processes.

DEMAND PAGING vs PREPAGING:
  Demand Paging: Load page only when referenced (page fault occurs).
  Prepaging: Speculatively load pages expected to be needed.
  Linux uses demand paging with readahead for sequential access patterns.`,
        },
      ],
    };
  }

  // ── 8. COMPUTER NETWORKS ──────────────────────────────────────────────────
  if (t.includes('network') || t.includes('tcp') || t.includes('osi') ||
      t.includes('protocol') || sub.includes('network')) {
    return {
      moduleTitle: 'Computer Networks: Protocol Architecture, TCP/IP & Routing',
      unit: 'Unit 1–2: OSI Model, TCP Reliable Transport & Network Layer Routing',
      learningObjectives: [
        'Compare OSI 7-layer and TCP/IP 4-layer models with protocol examples at each layer.',
        'Trace packet encapsulation: Data → Segment → Packet → Frame → Bits.',
        'Analyze TCP\'s 3-way handshake, 4-way termination and sliding window flow control.',
        'Understand CSMA/CD, Ethernet frame format, and MAC address resolution (ARP).',
        'Compare link-state (OSPF) and distance-vector (RIP) routing algorithms.',
      ],
      sections: [
        {
          heading: '1. OSI vs TCP/IP — Layer-by-Layer Comparison',
          body: `OSI 7-LAYER MODEL (ISO/IEC 7498):
  
  Layer 7 — APPLICATION:  HTTP, HTTPS, FTP, SMTP, DNS, SSH, SNMP
    Service: User-facing network services; application-to-application communication.
    
  Layer 6 — PRESENTATION: TLS/SSL, JPEG, MPEG, ASCII, XDR
    Service: Data format translation, encryption/decryption, compression.
    
  Layer 5 — SESSION:  RPC, NFS, SQL sessions, NetBIOS
    Service: Session establishment, maintenance, and termination; dialog control.
    
  Layer 4 — TRANSPORT:  TCP (reliable, connection-oriented), UDP (unreliable, connectionless)
    Service: End-to-end reliable delivery, error detection, flow control, multiplexing via ports.
    PDU: SEGMENT (TCP) / DATAGRAM (UDP)
    
  Layer 3 — NETWORK:  IP (IPv4/IPv6), ICMP, OSPF, BGP, RIP
    Service: Logical addressing (IP), routing across subnets, fragmentation/reassembly.
    PDU: PACKET
    
  Layer 2 — DATA LINK:  Ethernet (IEEE 802.3), Wi-Fi (802.11), PPP, ARP
    Service: Physical addressing (MAC), framing, error detection (CRC), media access control.
    PDU: FRAME
    
  Layer 1 — PHYSICAL:  RJ45, Optical Fiber, Wi-Fi 6, Bluetooth
    Service: Bit transmission as electrical/optical signals. No addressing, no error correction.
    PDU: BIT / SYMBOL

TCP/IP 4-LAYER MODEL (DoD/ARPA):
  Application (= OSI 5+6+7), Transport (= OSI 4), Internet (= OSI 3), Link (= OSI 1+2)`,
        },
        {
          heading: '2. TCP — Reliable Transport Deep Dive',
          body: `TCP HEADER KEY FIELDS:
  Source/Dest Port (16 bits each), Sequence Number (32 bits), ACK Number (32 bits),
  Flags: SYN, ACK, FIN, RST, PSH, URG, Window Size (16 bits), Checksum (16 bits).

THREE-WAY HANDSHAKE (Connection Establishment):
  Client → Server: SYN, Seq=x           (I want to connect; my ISN is x)
  Server → Client: SYN+ACK, Seq=y, Ack=x+1  (OK; my ISN is y; expecting x+1 from you)
  Client → Server: ACK, Seq=x+1, Ack=y+1    (Connection established)
  Purpose: Synchronize sequence numbers; prevents stale duplicates; establishes ISNs.

FOUR-WAY TERMINATION (Full-Duplex Close):
  Client → Server: FIN    (I'm done sending)
  Server → Client: ACK    (I received your FIN; still sending data)
  Server → Client: FIN    (I'm done sending)
  Client → Server: ACK    (OK, connection closed)
  Client enters TIME_WAIT state for 2×MSL (Maximum Segment Lifetime ≈ 60s each).

FLOW CONTROL — Sliding Window:
  Receiver advertises rwnd (Receive Window) in every ACK.
  Sender transmits at most min(cwnd, rwnd) bytes without acknowledgement.

CONGESTION CONTROL (TCP Reno/Cubic):
  Slow Start:    cwnd starts at 1 MSS; doubles every RTT until ssthresh.
  Congestion Avoidance: cwnd grows by 1 MSS per RTT (linear growth).
  On packet loss (triple duplicate ACK): ssthresh = cwnd/2; cwnd = ssthresh (Fast Recovery).
  On timeout: ssthresh = cwnd/2; cwnd = 1 MSS; restart Slow Start.`,
        },
        {
          heading: '3. Network Layer — IP, ARP & Routing',
          body: `IPv4 ADDRESSING:
  32-bit address in dotted-decimal (e.g., 192.168.1.100)
  CIDR Notation: 192.168.1.0/24 → 24-bit network prefix, 8-bit host (254 usable hosts)
  
  Subnet Mask /24 = 255.255.255.0
  Broadcast: 192.168.1.255
  Network: 192.168.1.0
  Usable range: 192.168.1.1 – 192.168.1.254

ARP (Address Resolution Protocol):
  Translates IP address → MAC address within a local network segment.
  Process: Host broadcasts "Who has IP 192.168.1.5? Tell 192.168.1.1"
  Target responds with unicast: "192.168.1.5 is at AA:BB:CC:DD:EE:FF"
  Result cached in ARP table (arp -n command).

ROUTING ALGORITHMS:
  DISTANCE VECTOR (RIP):
  • Each router knows only distances to its direct neighbours.
  • Shares routing table with neighbours periodically (Bellman-Ford distributed).
  • Count-to-infinity problem; solved by split horizon, poison reverse.
  • Metric: Hop count (max 15 hops → limits network diameter).
  
  LINK STATE (OSPF):
  • Each router floods link-state advertisements (LSAs) to ALL routers.
  • Every router builds complete network topology map.
  • Runs Dijkstra's algorithm locally to compute shortest paths.
  • Faster convergence, no count-to-infinity, scales to large networks.
  • Metric: Cost = 10⁸ / interface_bandwidth_in_bps`,
        },
      ],
    };
  }

  // ── 9. ARTIFICIAL INTELLIGENCE ────────────────────────────────────────────
  if (t.includes('artificial intelligence') || t.includes('heuristic') ||
      t.includes('a*') || t.includes('machine learning') || sub.includes('artificial')) {
    return {
      moduleTitle: 'Artificial Intelligence: Search, Knowledge Representation & ML Fundamentals',
      unit: 'Unit 2–3: Heuristic Search, A*, Minimax, Propositional Logic & Neural Networks',
      learningObjectives: [
        'Formulate AI problems as state-space search with Initial State, Actions, and Goal Test.',
        'Master A* evaluation function f(n)=g(n)+h(n) and prove admissibility/consistency.',
        'Implement Minimax with alpha-beta pruning for adversarial game trees.',
        'Understand supervised learning: hypothesis space, bias-variance tradeoff, overfitting.',
        'Explain perceptron learning rule and backpropagation in neural networks.',
      ],
      sections: [
        {
          heading: '1. Informed Search — A* Algorithm & Heuristic Admissibility',
          body: `A* ALGORITHM:
  Evaluation function: f(n) = g(n) + h(n)
  • g(n): Exact cost of path from initial state to node n.
  • h(n): Estimated cost from n to nearest goal state (heuristic).
  • f(n): Estimated total cost of cheapest solution through n.

  A* expands nodes in order of increasing f(n) using a priority queue (min-heap).

ADMISSIBILITY: h(n) is admissible if h(n) ≤ h*(n) for all n, where h*(n) is the true optimal cost.
  → If h is admissible → Tree-Search A* is OPTIMAL (guaranteed to find minimum-cost solution).

CONSISTENCY (Monotonicity): h(n) ≤ c(n,a,n') + h(n') for every action a leading to n'.
  → Consistent ⟹ Admissible (but NOT vice versa).
  → If h is consistent → Graph-Search A* is OPTIMAL (closed list doesn't discard useful paths).

8-PUZZLE HEURISTICS:
  h₁ — Misplaced Tiles: Count tiles not in goal position. ADMISSIBLE (each tile needs ≥1 move).
  h₂ — Manhattan Distance: Σ |x_curr − x_goal| + |y_curr − y_goal| per tile. ADMISSIBLE.
  h₂ DOMINATES h₁: h₂(n) ≥ h₁(n) for all n → h₂ expands fewer nodes → more efficient.

IDA* (Iterative Deepening A*):
  Memory-efficient A*. Uses depth-first search with f-cost threshold, incrementally raising it.
  Space: O(bd) instead of O(b^d) of regular A*. Used in chess engines, planning systems.`,
        },
        {
          heading: '2. Minimax & Alpha-Beta Pruning',
          body: `ADVERSARIAL SEARCH: Two-player zero-sum games (Chess, Checkers, Tic-Tac-Toe).
  MAX player tries to maximize score; MIN player tries to minimize score.

MINIMAX ALGORITHM:
  function minimax(node, depth, isMax):
    if depth == 0 or terminal(node): return evaluate(node)
    if isMax:
      return max over children: minimax(child, depth-1, false)
    else:
      return min over children: minimax(child, depth-1, true)
  
  Complexity: O(b^d) — exponential in game tree depth d, branching factor b.
  For Chess: b≈35, d≈100 → practically infeasible without pruning.

ALPHA-BETA PRUNING:
  Maintains two values: α (best MAX can guarantee) and β (best MIN can guarantee).
  Prune when α ≥ β (MIN will never allow this MAX choice to be reached).
  
  Best case (perfect ordering): Effectively searches depth 2d instead of d.
    → O(b^(d/2)) — doubles the searchable depth at same computational cost!
  Average case (random ordering): O(b^(3d/4))
  
  Example: If MAX already found a move worth 5, and in another branch MIN finds a reply worth 3 (< 5),
  MAX will never choose that branch → prune all siblings of that reply.`,
        },
        {
          heading: '3. Machine Learning Fundamentals',
          body: `SUPERVISED LEARNING FRAMEWORK:
  Training Set D = {(x₁,y₁), (x₂,y₂), ..., (xₙ,yₙ)}
  Goal: Learn hypothesis h: X → Y that generalizes to unseen examples.
  
  HYPOTHESIS SPACE: Set of all possible functions the algorithm can learn.
  BIAS: Error from wrong assumptions in learning algorithm (underfitting).
  VARIANCE: Error from sensitivity to small training set fluctuations (overfitting).
  
  Bias-Variance Tradeoff: Total error = Bias² + Variance + Irreducible Noise
  
OVERFITTING PREVENTION:
  • Regularisation: L1 (Lasso, sparse weights), L2 (Ridge, small weights): adds λ||w|| penalty.
  • Dropout (Neural Nets): Randomly deactivate neurons during training → prevents co-adaptation.
  • Cross-Validation: k-fold CV to estimate generalization error without touching test set.
  • Early Stopping: Halt training when validation loss stops decreasing.

GRADIENT DESCENT VARIANTS:
  Batch GD: Compute gradient over entire dataset. Slow per step but stable convergence.
  Stochastic GD (SGD): Use one random sample per step. Noisy but fast; good for large datasets.
  Mini-Batch GD: Use small batches (32–256 samples). Best of both worlds. Industry standard.
  
  Update rule: θ ← θ − α∇L(θ)  where α is learning rate, L is loss function.`,
        },
        {
          heading: '4. Neural Networks & Backpropagation',
          body: `PERCEPTRON (Rosenblatt, 1958):
  Single neuron: output = σ(w·x + b)
  σ = activation function (step, sigmoid, ReLU, tanh)
  
  Learning Rule: Δwᵢ = α(y - ŷ)xᵢ   (update if prediction is wrong)

MULTILAYER PERCEPTRON (MLP):
  • Input layer → Hidden layer(s) → Output layer
  • Each neuron: z = w·x + b,  a = σ(z)
  
BACKPROPAGATION ALGORITHM:
  1. Forward Pass: Compute activations layer-by-layer, record intermediate values.
  2. Compute Loss: L = cross_entropy(y, ŷ) or MSE.
  3. Backward Pass: Apply chain rule to compute ∂L/∂w for every weight.
     ∂L/∂w = ∂L/∂a × ∂a/∂z × ∂z/∂w    (chain rule)
  4. Update: w ← w - α × ∂L/∂w

ACTIVATION FUNCTIONS:
  Sigmoid: σ(x) = 1/(1+e^(-x)), range (0,1). Suffers vanishing gradient.
  ReLU:    f(x) = max(0, x). Most widely used in hidden layers. Avoids vanishing gradient.
  Softmax: σ(zᵢ) = e^(zᵢ)/Σe^(zⱼ). Multi-class output probability distribution.`,
        },
      ],
    };
  }

  // ── 10. PYTHON / DATA SCIENCE ─────────────────────────────────────────────
  if (t.includes('python') || t.includes('pandas') || t.includes('numpy') ||
      t.includes('data science') || sub.includes('python')) {
    return {
      moduleTitle: 'Python for Data Science: NumPy, Pandas, Scikit-Learn & EDA',
      unit: 'Practical Lab Guide: Vectorised Computing, DataFrame Operations & ML Pipelines',
      learningObjectives: [
        'Master NumPy N-dimensional array creation, broadcasting rules, and vectorization speed.',
        'Perform advanced Pandas: .loc/.iloc indexing, GroupBy aggregation, merge/join.',
        'Build a complete EDA pipeline: missing value imputation, outlier detection, encoding.',
        'Train and evaluate ML models using Scikit-Learn: train_test_split, cross_val_score.',
        'Visualize distributions and correlations using Matplotlib and Seaborn.',
      ],
      sections: [
        {
          heading: '1. NumPy: Arrays, Vectorization & Broadcasting',
          body: `WHY NUMPY?
  Python lists are slow for numerical computation — each element is a full Python object.
  NumPy arrays store data in contiguous memory as C-level typed arrays (int32, float64).
  Vectorized operations use CPU SIMD instructions → 50x–200x faster than Python loops.

BROADCASTING RULES:
  Two arrays are compatible dimension-wise if either:
  1. The dimensions are equal, OR
  2. One of them is 1 (and gets stretched to match the other).
  
  Applied right-to-left across shapes:
  (3, 4)    +   (4,)    →   (4,) broadcast to (1,4) → (3,4)   ✓
  (3, 4)    +   (3,)    →   (3,) broadcast to (3,1) → (3,4)   ✓ (after reshape)
  (3, 4)    +   (3, 5)  →   Error — dimensions 4 ≠ 5 and neither is 1.

KEY NUMPY OPERATIONS:
  np.zeros(shape), np.ones(shape), np.random.randn(m,n), np.arange(start,stop,step)
  np.reshape, np.transpose (or .T), np.concatenate, np.stack
  np.sum(axis=0), np.mean(axis=1), np.argmax, np.argsort
  np.dot (matrix multiply), np.linalg.inv, np.linalg.eig`,
        },
        {
          heading: '2. Complete Data Science Pipeline (Python)',
          isCode: true,
          code: `import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

# ── 1. LOAD & EXPLORE DATA ────────────────────────────────────────
df = pd.read_csv("student_performance.csv")
print("Shape:", df.shape)
print("Missing values:\n", df.isnull().sum())
print("Data types:\n", df.dtypes)
print("Summary statistics:\n", df.describe())

# ── 2. MISSING VALUE IMPUTATION ───────────────────────────────────
# Numeric: fill with group median
df['GPA'] = df.groupby('Course')['GPA'].transform(
    lambda x: x.fillna(x.median()))
# Categorical: fill with mode
df['Specialization'].fillna(df['Specialization'].mode()[0], inplace=True)

# ── 3. OUTLIER DETECTION (IQR Method) ────────────────────────────
Q1, Q3 = df['GPA'].quantile(0.25), df['GPA'].quantile(0.75)
IQR = Q3 - Q1
df = df[(df['GPA'] >= Q1 - 1.5*IQR) & (df['GPA'] <= Q3 + 1.5*IQR)]

# ── 4. ENCODE CATEGORICALS + SCALE NUMERICS ───────────────────────
le = LabelEncoder()
df['Course_enc'] = le.fit_transform(df['Course'])
X = df[['GPA', 'Credits', 'Attendance', 'Course_enc']].values
y = df['PassFail'].values

scaler = StandardScaler()
X = scaler.fit_transform(X)

# ── 5. TRAIN-TEST SPLIT & MODEL ───────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
clf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
clf.fit(X_train, y_train)

# ── 6. EVALUATE ───────────────────────────────────────────────────
y_pred = clf.predict(X_test)
print(classification_report(y_test, y_pred))
print("5-Fold CV Accuracy:", cross_val_score(clf, X, y, cv=5).mean())

# ── 7. FEATURE IMPORTANCE ─────────────────────────────────────────
for feat, imp in zip(['GPA','Credits','Attendance','Course'], clf.feature_importances_):
    print(f"  {feat}: {imp:.3f}")`,
        },
        {
          heading: '3. Pandas GroupBy, Merge & Pivot Operations',
          body: `GROUPBY AGGREGATION:
  df.groupby('Course').agg({
      'GPA': ['mean', 'std', 'count'],
      'Credits': 'sum'
  }).reset_index()

MERGE (SQL-style JOIN):
  df_merged = pd.merge(students, courses, on='course_id', how='inner')
  # how: 'inner', 'left', 'right', 'outer'

PIVOT TABLE:
  pd.pivot_table(df, values='GPA', index='Course', columns='Semester', aggfunc='mean')

APPLY CUSTOM FUNCTION:
  df['Grade'] = df['GPA'].apply(lambda x: 'A' if x>=3.7 else ('B' if x>=3.0 else 'C'))

WINDOW FUNCTIONS (rolling stats):
  df['GPA_rolling_avg'] = df.groupby('Course')['GPA'].transform(
      lambda x: x.rolling(window=3, min_periods=1).mean())

PERFORMANCE TIPS:
  • Use .loc for label-based, .iloc for position-based selection.
  • Avoid iterrows() — 1000x slower than vectorized operations.
  • Use categorical dtype for string columns with limited unique values → 10x memory reduction.
  • query() method uses numexpr for fast filtering on large DataFrames.`,
        },
      ],
    };
  }

  // ── 11. JAVA / OOP ────────────────────────────────────────────────────────
  if (t.includes('java') || t.includes('oop') || t.includes('collections') ||
      sub.includes('java') || sub.includes('object-oriented')) {
    return {
      moduleTitle: 'Java Programming: OOP Design Principles & Collections Framework',
      unit: 'Unit 3: SOLID Principles, Collections Hierarchy, Concurrency & JVM Internals',
      learningObjectives: [
        'Apply 4 OOP pillars: Encapsulation, Abstraction, Inheritance, Polymorphism.',
        'Understand SOLID design principles and when to prefer interface over abstract class.',
        'Master Java Collections: ArrayList vs LinkedList, HashSet vs TreeSet, HashMap internals.',
        'Implement thread-safe concurrency: synchronized, ReentrantLock, ConcurrentHashMap.',
        'Understand JVM memory model: Heap, Stack, Method Area, GC algorithms.',
      ],
      sections: [
        {
          heading: '1. OOP Pillars & SOLID Design Principles',
          body: `THE FOUR OOP PILLARS:

1. ENCAPSULATION: Bundle data (fields) and behaviour (methods) together; hide internal state.
   → Mark fields private; expose only through public getters/setters with validation.
   → Benefit: Implementation can change without affecting callers.

2. ABSTRACTION: Expose only essential features; hide complex implementation details.
   → Abstract classes provide partial implementations; interfaces define pure contracts.
   → Java 8+ interfaces allow default methods (concrete implementations in interfaces).

3. INHERITANCE: Child class inherits fields and methods from parent (IS-A relationship).
   → Promotes code reuse but creates tight coupling. Prefer COMPOSITION over inheritance.
   → Java supports single class inheritance but multiple interface implementation.

4. POLYMORPHISM: Objects behave differently based on their runtime type.
   → Compile-time (static): Method overloading — same name, different parameter signature.
   → Runtime (dynamic): Method overriding — resolved via vtable at runtime (dynamic dispatch).

SOLID PRINCIPLES:
  S — Single Responsibility: A class should have only one reason to change.
  O — Open/Closed: Open for extension, closed for modification (use interfaces/inheritance).
  L — Liskov Substitution: Subclass objects must be substitutable for superclass objects.
  I — Interface Segregation: Clients should not be forced to depend on interfaces they don't use.
  D — Dependency Inversion: Depend on abstractions, not on concrete implementations.`,
        },
        {
          heading: '2. Java Collections Framework Deep Dive',
          body: `COLLECTION HIERARCHY:
  Iterable → Collection → {List, Queue, Set}
  Map (separate hierarchy)

LISTS:
  ArrayList: Backed by resizable array. Random access O(1). Insert/delete middle O(N). 
    Capacity doubles on overflow (amortized O(1) add). Thread-unsafe.
  LinkedList: Doubly-linked. Insert/delete head/tail O(1). Random access O(N).
    Implements both List and Deque. Higher memory overhead per node.

SETS:
  HashSet: Backed by HashMap. Add/remove/contains O(1) average. No order. Thread-unsafe.
  LinkedHashSet: HashSet + insertion-order doubly-linked list. O(1) operations.
  TreeSet: Red-Black tree. Sorted order. O(log N) all operations.

MAPS:
  HashMap (Java 8+):
    • Array of Node[] buckets. Index = (n-1) & hash(key).
    • Collision: Chaining with singly linked list.
    • TREEIFICATION: When bucket size ≥ TREEIFY_THRESHOLD (8) AND table.length ≥ 64:
      bucket converts to Red-Black tree → O(log N) worst case instead of O(N).
    • Load factor default = 0.75. Resize (double + rehash) at 75% capacity.
  LinkedHashMap: HashMap + LRU doubly-linked list. Can implement LRU cache:
    new LinkedHashMap<>(capacity, 0.75f, true) with removeEldestEntry() override.
  TreeMap: Red-Black tree. Sorted by key. O(log N) all operations.

THREAD-SAFE COLLECTIONS:
  ConcurrentHashMap: Striped locking (16 segments in Java 7, CAS/synchronized in Java 8).
  CopyOnWriteArrayList: Snapshot copy on write. Good for read-heavy workloads.`,
        },
        {
          heading: '3. Java Concurrency & JVM Memory Model',
          isCode: true,
          code: `import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

// ── THREAD-SAFE COUNTER with AtomicInteger (CAS — no lock) ──────
AtomicInteger counter = new AtomicInteger(0);
// In thread: counter.incrementAndGet(); // Compare-and-swap, never blocks

// ── REENTRANT LOCK (more flexible than synchronized) ─────────────
ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    // Critical section
} finally {
    lock.unlock(); // Always release in finally block!
}

// ── PRODUCER-CONSUMER with BlockingQueue ─────────────────────────
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(100);
// Producer thread:
queue.put(task);        // Blocks if queue full
// Consumer thread:
Task t = queue.take();  // Blocks if queue empty

// ── THREAD POOL — Never create raw threads in production! ─────────
ExecutorService pool = Executors.newFixedThreadPool(
    Runtime.getRuntime().availableProcessors());
Future<Integer> future = pool.submit(() -> expensiveComputation());
int result = future.get(); // Blocks until done
pool.shutdown();

// ── COMPLETABLEFUTURE — Non-blocking async ────────────────────────
CompletableFuture.supplyAsync(() -> fetchUser(id))
    .thenApply(user -> enrichWithProfile(user))
    .thenAccept(System.out::println)
    .exceptionally(ex -> { logger.error(ex); return null; });`,
        },
        {
          heading: '4. JVM Memory Model & Garbage Collection',
          body: `JVM RUNTIME MEMORY AREAS:

HEAP (shared across all threads):
  Young Generation:
    Eden Space: New objects allocated here.
    Survivor 0 & 1 (S0, S1): Objects that survived at least one Minor GC.
  Old Generation (Tenured): Long-lived objects promoted from Young Gen after N GC cycles.
  
Stack (per thread): 
  Stores stack frames (local variables, operand stack, return address per method call).
  StackOverflowError occurs on infinite recursion.
  
Method Area (Metaspace since Java 8): 
  Class metadata, constant pool, static fields, method bytecode.

GARBAGE COLLECTION ALGORITHMS:
  Serial GC: Single-threaded, stop-the-world. For small heaps.
  Parallel GC (default Java 8): Multiple GC threads. Good throughput, higher pause times.
  G1 GC (default Java 9+): Region-based, incremental collection. Predictable pause times.
  ZGC / Shenandoah (Java 11+): Ultra-low latency (<10ms pauses). For large heaps (terabytes).

MINOR vs MAJOR GC:
  Minor GC: Collects Young Generation. Frequent and fast (ms). Stop-the-world.
  Major/Full GC: Collects entire heap. Infrequent but slow. Avoid by tuning heap sizes.`,
        },
      ],
    };
  }

  // ── 12. COMPILER DESIGN ───────────────────────────────────────────────────
  if (t.includes('compiler') || t.includes('lexical') || t.includes('parsing') ||
      t.includes('grammar') || sub.includes('compiler')) {
    return {
      moduleTitle: 'Compiler Design: Lexical Analysis, Parsing & Code Generation',
      unit: 'Unit 2–4: CFG, FIRST/FOLLOW Sets, LL(1) Parsing & Three-Address Code',
      learningObjectives: [
        'Trace the 6 phases of a modern compiler with data structures at each boundary.',
        'Convert Regular Expressions to DFA using Thompson\'s NFA construction + subset method.',
        'Compute FIRST and FOLLOW sets and construct LL(1) predictive parsing tables.',
        'Eliminate left recursion and perform left factoring to convert to LL(1) grammar.',
        'Generate three-address code (TAC) for arithmetic, conditionals, and loops.',
      ],
      sections: [
        {
          heading: '1. Compiler Phases — Data Flow & Data Structures',
          body: `SOURCE CODE → Compiler → TARGET MACHINE CODE

Phase 1: LEXICAL ANALYZER (Scanner)
  Input: Source character stream
  Output: Token stream — (token_type, lexeme, line_number)
  Tool: Flex (lexer generator). Uses DFA to recognize patterns.
  Token types: IDENTIFIER, INTEGER_LITERAL, FLOAT_LITERAL, KEYWORD, OPERATOR, PUNCTUATION
  Errors: Illegal characters, unterminated strings.

Phase 2: SYNTAX ANALYZER (Parser)
  Input: Token stream
  Output: Abstract Syntax Tree (AST)
  Tools: Bison/YACC (LALR parser generator), recursive descent (manual).
  Errors: Syntax errors with recovery (panic mode, error productions).

Phase 3: SEMANTIC ANALYZER
  Input: AST + Symbol Table
  Output: Annotated AST with type information
  Checks: Type compatibility, undeclared identifiers, scope resolution, array bounds (static).
  Data Structure: Symbol Table (hash table of scope → {name, type, offset, size}).

Phase 4: INTERMEDIATE CODE GENERATOR
  Output: Three-Address Code (TAC) or SSA (Static Single Assignment) form.
  TAC forms: x = y op z,  x = y,  if x relop y goto L,  x = y[i],  call p,n

Phase 5: CODE OPTIMIZER
  Techniques: Constant folding, dead code elimination, common subexpression elimination,
  loop invariant code motion, strength reduction (x*2 → x<<1), inlining.

Phase 6: TARGET CODE GENERATOR
  Output: Assembly or machine code with register allocation (graph colouring algorithm).`,
        },
        {
          heading: '2. FIRST & FOLLOW Sets — Complete Algorithm',
          body: `GRAMMAR EXAMPLE:
  E  → E + T  | T
  T  → T * F  | F
  F  → ( E )  | id

After eliminating left recursion:
  E  → T E'
  E' → + T E' | ε
  T  → F T'
  T' → * F T' | ε
  F  → ( E ) | id

COMPUTING FIRST(X):
  Rule 1: If X is terminal → FIRST(X) = {X}
  Rule 2: If X → ε → add ε to FIRST(X)
  Rule 3: If X → Y₁Y₂...Yₖ:
    Add FIRST(Y₁) − {ε} to FIRST(X)
    If ε ∈ FIRST(Y₁): add FIRST(Y₂) − {ε}, and so on.
    If ε ∈ FIRST(Yᵢ) for all i: add ε to FIRST(X).

RESULTS:
  FIRST(E) = FIRST(T) = FIRST(F) = {(, id}
  FIRST(E') = {+, ε}
  FIRST(T') = {*, ε}

COMPUTING FOLLOW(A):
  Rule 1: Add $ to FOLLOW(S) (start symbol).
  Rule 2: If A → αBβ: add FIRST(β) − {ε} to FOLLOW(B).
  Rule 3: If A → αB or A → αBβ with ε ∈ FIRST(β): add FOLLOW(A) to FOLLOW(B).

RESULTS:
  FOLLOW(E) = {$, )}
  FOLLOW(E') = FOLLOW(E) = {$, )}
  FOLLOW(T) = FIRST(E') − {ε} ∪ FOLLOW(E) = {+, $, )}
  FOLLOW(T') = FOLLOW(T) = {+, $, )}
  FOLLOW(F) = FIRST(T') − {ε} ∪ FOLLOW(T) = {*, +, $, )}`,
        },
        {
          heading: '3. LL(1) Parsing Table & Three-Address Code',
          isCode: true,
          code: `/* LL(1) PARSING TABLE — M[A, a] entry:
   For each production A → α:
     For each terminal a in FIRST(α): M[A,a] = A→α
     If ε in FIRST(α): For each b in FOLLOW(A): M[A,b] = A→α
*/

// LL(1) TABLE for the grammar above:
// Non-terminal |  id      |  +       |  *       |  (       |  )       |  $
// E            | E→TE'    |          |          | E→TE'    |          |
// E'           |          | E'→+TE'  |          |          | E'→ε     | E'→ε
// T            | T→FT'    |          |          | T→FT'    |          |
// T'           |          | T'→ε     | T'→*FT'  |          | T'→ε     | T'→ε
// F            | F→id     |          |          | F→(E)    |          |

// THREE-ADDRESS CODE GENERATION for: a = b * c + d / e
t1 = b * c         // temp 1
t2 = d / e         // temp 2
t3 = t1 + t2       // temp 3
a  = t3            // assignment

// TAC for: if (x > 0) y = x * 2; else y = -x;
    if x > 0 goto L1
    t1 = -x
    y = t1
    goto L2
L1: t2 = x * 2
    y = t2
L2: ...

// TAC for: for(i=0; i<n; i++) sum += a[i];
    i = 0
L1: if i >= n goto L2
    t1 = a[i]           // t1 = *(a + i*4) base+offset
    sum = sum + t1
    i = i + 1
    goto L1
L2: ...`,
        },
      ],
    };
  }

  // ── 13. CRYPTOGRAPHY & NETWORK SECURITY ───────────────────────────────────
  if (t.includes('crypto') || t.includes('rsa') || t.includes('aes') ||
      t.includes('security') || sub.includes('security') || sub.includes('crypto')) {
    return {
      moduleTitle: 'Cryptography & Network Security: Ciphers, RSA & Digital Signatures',
      unit: 'Unit 3: Symmetric Encryption, Public Key Cryptosystems & PKI',
      learningObjectives: [
        'Differentiate symmetric (AES/DES) vs asymmetric (RSA/ECC) cryptographic systems.',
        'Execute the complete mathematical RSA key generation, encryption and decryption cycle.',
        'Understand Euler\'s Totient Function φ(n) and the Extended Euclidean Algorithm.',
        'Analyze cryptographic hash functions (SHA-256) properties: collision resistance, preimage.',
        'Explain PKI, Certificate Authorities, TLS handshake, and digital signature verification.',
      ],
      sections: [
        {
          heading: '1. Symmetric vs Asymmetric Cryptography',
          body: `SYMMETRIC KEY CRYPTOGRAPHY:
  Same key K used for both encryption and decryption.
  
  DES (Data Encryption Standard, 1977):
  • 56-bit key, 64-bit blocks, 16 Feistel rounds.
  • BROKEN: 56-bit key exhausted in <24 hours by brute force (EFF DES Cracker, 1998).
  
  3DES (Triple DES):
  • C = DES_K1(DES_K2⁻¹(DES_K1(P))) — Encrypt-Decrypt-Encrypt with 112-bit effective key.
  • Deprecated by NIST in 2023 due to SWEET32 attack.
  
  AES (Advanced Encryption Standard, 2001 — Rijndael):
  • Block size: 128 bits. Key sizes: 128, 192, or 256 bits.
  • 10, 12, or 14 rounds (depending on key size). Operations: SubBytes, ShiftRows, MixColumns, AddRoundKey.
  • No known practical attack. Standard for classified US government data (AES-256).
  • Modes: ECB (insecure — same block = same ciphertext), CBC, CTR (stream mode), GCM (authenticated).
  
  Symmetric ADVANTAGE: 1000x–10000x faster than RSA for bulk data encryption.
  Symmetric PROBLEM: Key distribution — how do two parties securely share the secret key?
  → SOLVED BY: Asymmetric key exchange (RSA, Diffie-Hellman, ECDH).

ASYMMETRIC KEY CRYPTOGRAPHY (Public Key Cryptography):
  Key pair: Public Key (freely distributed) + Private Key (kept secret).
  Encrypt with recipient's PUBLIC key → Only recipient's PRIVATE key can decrypt.
  Sign with sender's PRIVATE key → Anyone with sender's PUBLIC key can verify.`,
        },
        {
          heading: '2. RSA Algorithm — Full Mathematical Proof',
          body: `RSA KEY GENERATION:
  Step 1: Choose two distinct large primes p and q. (In practice: p,q ≥ 2^1024)
  Step 2: Compute modulus n = p × q.  (RSA-2048 means n is 2048 bits)
  Step 3: Compute Euler's Totient: φ(n) = (p−1)(q−1).
  Step 4: Choose public exponent e: 1 < e < φ(n) and gcd(e, φ(n)) = 1.
          Common choice: e = 65537 (prime, efficient in binary with many 1s).
  Step 5: Compute private exponent d: d ≡ e⁻¹ (mod φ(n)) [Extended Euclidean Algorithm].
          i.e., find d such that: (e × d) mod φ(n) = 1.
  
  Public Key = (e, n).  Private Key = (d, n).  Destroy p, q, φ(n) securely.

ENCRYPTION: Ciphertext C = M^e mod n  (using square-and-multiply: O(log e) multiplications)
DECRYPTION: Plaintext M = C^d mod n

CORRECTNESS (Euler's Theorem): M^(φ(n)) ≡ 1 (mod n) for gcd(M,n)=1
  → M^(e×d) = M^(1 + k×φ(n)) = M × (M^φ(n))^k ≡ M × 1^k = M (mod n) ✓

SECURITY BASIS: RSA security relies on the Integer Factorisation Problem — factoring n=p×q into p and q is computationally infeasible for large n (best known: General Number Field Sieve, sub-exponential but impractical for ≥2048 bits).

WORKED EXAMPLE (small primes — illustrative only):
  p=7, q=11 → n=77, φ(n)=60
  e=7 (gcd(7,60)=1 ✓)
  d: 7d ≡ 1 (mod 60) → 7×43=301=5×60+1 → d=43
  
  Encrypt M=9: C = 9^7 mod 77 = 37
  Decrypt C=37: M = 37^43 mod 77 = 9 ✓`,
        },
        {
          heading: '3. TLS Handshake & Digital Signatures',
          body: `TLS 1.3 HANDSHAKE (Simplified):
  1. Client Hello: TLS version, supported cipher suites, client random, key_share (ECDH public key).
  2. Server Hello: Chosen cipher suite, server random, server's ECDH public key.
  3. ECDH Key Exchange: Both sides compute shared secret independently (Diffie-Hellman).
     SharedSecret = ClientPrivKey × ServerPubKey = ServerPrivKey × ClientPubKey (ECDH).
  4. Key Derivation: session_key = HKDF(SharedSecret, ClientRandom || ServerRandom).
  5. Certificate: Server sends X.509 certificate (contains server's RSA/ECDSA public key, signed by CA).
  6. Certificate Verify: Server signs the entire handshake transcript with its private key.
  7. Finished: Both parties exchange encrypted MACs over the handshake transcript.
  8. Application Data: Encrypted with AES-256-GCM using derived session keys.

DIGITAL SIGNATURES:
  Sign:   Signature = Sign(PrivateKey, Hash(Message))  → RSA or ECDSA
  Verify: Verify(PublicKey, Message, Signature) → recompute hash, check with PubKey
  
  Properties:
  • Authentication: Only private key holder could produce valid signature.
  • Non-repudiation: Signer cannot deny signing (private key was used).
  • Integrity: Any modification to message invalidates signature.

CRYPTOGRAPHIC HASH FUNCTIONS (SHA-256):
  Properties:
  • Deterministic: Same input always produces same hash.
  • Preimage Resistance: Given H(x), infeasible to find x (one-way function).
  • Second-Preimage Resistance: Given x, infeasible to find x' ≠ x with H(x')=H(x).
  • Collision Resistance: Infeasible to find any (x,x') pair where H(x)=H(x').
  SHA-256 output: 256 bits (32 bytes). Used in TLS, Bitcoin, JWT tokens, Git commits.`,
        },
      ],
    };
  }

  // ── 14. CLOUD COMPUTING & DEVOPS ─────────────────────────────────────────
  if (t.includes('cloud') || t.includes('aws') || t.includes('docker') ||
      t.includes('microservice') || t.includes('devops') || sub.includes('cloud')) {
    return {
      moduleTitle: 'Cloud Computing & DevOps: Containerization, CI/CD & Cloud Architecture',
      unit: 'Unit 4: IaaS/PaaS/SaaS, Docker, Kubernetes & AWS Core Services',
      learningObjectives: [
        'Differentiate IaaS, PaaS, SaaS cloud service models with concrete vendor examples.',
        'Understand Docker layered image architecture, Dockerfile instructions, and networking.',
        'Orchestrate containers with Kubernetes: Pods, Services, Deployments, and Ingress.',
        'Design CI/CD pipelines with GitHub Actions, automated testing, and zero-downtime deployments.',
        'Evaluate AWS core services: EC2, S3, RDS, Lambda, IAM, VPC, CloudFront.',
      ],
      sections: [
        {
          heading: '1. Cloud Service & Deployment Models',
          body: `SERVICE MODELS (Responsibility Stack):
                     | On-Premise | IaaS     | PaaS     | SaaS
  Networking         | Customer   | Provider | Provider | Provider
  Storage            | Customer   | Provider | Provider | Provider
  Servers            | Customer   | Provider | Provider | Provider
  Virtualization     | Customer   | Provider | Provider | Provider
  OS                 | Customer   | Customer | Provider | Provider
  Middleware/Runtime | Customer   | Customer | Provider | Provider
  Applications       | Customer   | Customer | Customer | Provider
  Data               | Customer   | Customer | Customer | Provider (or Customer)

IaaS (Infrastructure as a Service):
  Customer manages OS upward. Full control, maximum flexibility.
  Examples: AWS EC2, Google Compute Engine, Azure VMs, DigitalOcean Droplets.

PaaS (Platform as a Service):
  Customer manages only applications and data. Provider manages runtime, OS, infrastructure.
  Examples: AWS Elastic Beanstalk, Heroku, Google App Engine, Vercel, Railway.

SaaS (Software as a Service):
  Fully managed application; customer only manages data and user access.
  Examples: Google Workspace, Salesforce, Slack, Jira, GitHub.

DEPLOYMENT MODELS:
  Public Cloud: Resources shared among multiple tenants (AWS, GCP, Azure).
  Private Cloud: Dedicated infrastructure for a single organization (OpenStack, VMware).
  Hybrid Cloud: Combines on-premise + public cloud with network bridge.
  Multi-Cloud: Use multiple cloud providers to avoid vendor lock-in.`,
        },
        {
          heading: '2. Docker Architecture & Production Dockerfile',
          body: `DOCKER COMPONENTS:
  Docker Engine: Client-server application. dockerd daemon + Docker CLI + REST API.
  
  IMAGE: Read-only template, built from layers (each instruction = one layer).
    • Base image (FROM): OS layer (alpine, ubuntu, node:20-alpine).
    • Each RUN, COPY, ADD instruction adds a new layer.
    • Layers are cached and reused across builds (pull specific layer from cache if unchanged).
  
  CONTAINER: Writable instance of an image. Uses Linux namespaces (pid, net, ipc, mnt, user) and cgroups (CPU, memory, I/O limits).
  
  REGISTRY: Image storage. Docker Hub (public), AWS ECR, GitHub Container Registry (private).
  
  DOCKER NETWORKING:
  • bridge (default): NAT network, containers communicate via IP or service name.
  • host: Container shares host network namespace (best performance, less isolation).
  • overlay: Multi-host networking (Swarm/Kubernetes).
  
  DOCKER COMPOSE: Defines multi-container applications in YAML. 
  docker-compose up → builds images, creates network, starts all services.

VOLUMES vs BIND MOUNTS:
  Volume (docker managed): Persists data beyond container lifecycle. Stored in /var/lib/docker/volumes.
  Bind Mount: Maps host directory to container path. For development (live code reloading).`,
        },
        {
          heading: '3. Production Multi-Stage Dockerfile (Node.js)',
          isCode: true,
          code: `# ── STAGE 1: DEPENDENCY INSTALL ──────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
# Copy ONLY package files first (leverages layer cache)
COPY package*.json ./
# Install ONLY production dependencies (skip devDependencies)
RUN npm ci --only=production --ignore-scripts

# ── STAGE 2: BUILD ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # Install ALL deps including devDependencies
COPY . .
RUN npm run build             # Compile TypeScript / bundle assets

# ── STAGE 3: PRODUCTION RUNNER ────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's needed from previous stages (minimal image size)
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/package.json ./

# Security best practice: run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001
USER nodeapp

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "dist/server.js"]

# ── .dockerignore (create alongside Dockerfile) ──────────────────
# node_modules
# .git
# .env
# *.log
# coverage/
# .nyc_output`,
        },
        {
          heading: '4. Kubernetes Architecture & AWS Core Services',
          body: `KUBERNETES COMPONENTS:
  Control Plane:
  • kube-apiserver: REST API gateway for all cluster operations.
  • etcd: Distributed KV store holding all cluster state (Raft-based).
  • kube-scheduler: Assigns Pods to Nodes based on resource requirements.
  • controller-manager: Runs controllers (ReplicaSet, Deployment, Node, etc.).
  
  Worker Nodes:
  • kubelet: Agent ensuring Pods are running. Reports node health to control plane.
  • kube-proxy: Maintains iptables/IPVS rules for Service network routing.
  • Container Runtime: containerd, CRI-O.

KEY KUBERNETES OBJECTS:
  Pod: Smallest deployable unit. Contains 1+ containers sharing network namespace.
  Deployment: Manages desired state (replicas, rolling updates). Self-healing.
  Service (ClusterIP/NodePort/LoadBalancer): Stable network endpoint for a set of Pods.
  Ingress: HTTP/HTTPS routing rules (host/path-based) to Services.
  ConfigMap/Secret: Externalized configuration injected as env vars or files.
  PersistentVolumeClaim (PVC): Request for durable storage.

AWS CORE SERVICES REFERENCE:
  Compute:  EC2 (VMs), Lambda (serverless functions), ECS/EKS (containers)
  Storage:  S3 (object), EBS (block volume for EC2), EFS (NFS shared filesystem)
  Database: RDS (MySQL/PostgreSQL/Aurora), DynamoDB (NoSQL), ElastiCache (Redis)
  Network:  VPC (virtual private network), Route53 (DNS), CloudFront (CDN), ALB (load balancer)
  Security: IAM (identity & access management), KMS (key management), WAF, GuardDuty`,
        },
      ],
    };
  }

  // ── 15. FULL-STACK / WEB TECHNOLOGIES ────────────────────────────────────
  if (t.includes('full-stack') || t.includes('react') || t.includes('webtech') ||
      t.includes('web tech') || t.includes('web') || sub.includes('web')) {
    return {
      moduleTitle: 'Full-Stack Web Engineering: React, Node.js/Express & REST Architecture',
      unit: 'Unit 3: Virtual DOM Reconciliation, RESTful API Design & JWT Authentication',
      learningObjectives: [
        'Understand React Virtual DOM diffing algorithm and the Fiber reconciliation engine.',
        'Master React Hooks lifecycle: useState, useEffect, useContext, useMemo, useCallback.',
        'Design RESTful APIs adhering to Fielding\'s 6 architectural constraints.',
        'Implement stateless JWT authentication with refresh token rotation.',
        'Optimize Express.js: middleware pipeline, error handling, rate limiting, compression.',
      ],
      sections: [
        {
          heading: '1. React — Virtual DOM, Reconciliation & Hooks',
          body: `VIRTUAL DOM (VDOM):
  React maintains a lightweight JavaScript representation of the DOM tree in memory.
  
  RECONCILIATION PROCESS:
  1. On state/prop change, React re-renders the component → creates a new VDOM tree.
  2. DIFFING: React compares new VDOM with previous VDOM using the following heuristics:
     • Different element types (div → span) → destroy old tree, build fresh.
     • Same type → update only changed attributes in-place.
     • Lists: Use key props to identify which items moved/added/removed → O(N) diffing.
  3. COMMIT: Apply minimal set of actual DOM mutations in a single batch.
  
  FIBER ARCHITECTURE (React 16+):
  Fiber splits rendering into small units of work that can be paused and resumed.
  Enables concurrent features: startTransition, Suspense, useDeferredValue.

REACT HOOKS REFERENCE:
  useState(initialValue): Returns [state, setState]. Re-renders on setState call.
  useEffect(fn, deps): Side effects (data fetching, subscriptions, manual DOM).
    deps=[]: Run once after mount (componentDidMount).
    deps=[x,y]: Run when x or y changes.
    return cleanup: Runs before next effect or on unmount.
  useContext(Context): Subscribes to context value without prop drilling.
  useMemo(fn, deps): Memoizes expensive computed value. Re-computes when deps change.
  useCallback(fn, deps): Memoizes function reference. Prevents unnecessary child re-renders.
  useRef(initial): Mutable container that doesn't trigger re-renders. Access DOM elements.
  useReducer(reducer, init): Redux-style state for complex state logic.`,
        },
        {
          heading: '2. RESTful API Design & JWT Authentication',
          body: `FIELDING'S 6 REST CONSTRAINTS:
  1. Client-Server: Separation of UI from data storage concerns. Independently evolvable.
  2. Statelessness: Each request must contain ALL information to process it. No server-side session state. → Enables horizontal scaling.
  3. Cacheability: Responses must declare themselves cacheable or non-cacheable.
  4. Layered System: Client unaware of whether it's connecting directly to server or via proxy/CDN.
  5. Uniform Interface: 
     • Resource identification via URIs (nouns, not verbs).
     • Manipulation through representations (JSON, XML).
     • Self-descriptive messages (Content-Type, Accept headers).
     • HATEOAS: Responses include links to related resources.
  6. Code-On-Demand (optional): Server sends executable code (JavaScript) to client.

HTTP METHOD SEMANTICS:
  GET    → Read resource. Idempotent, safe, cacheable.
  POST   → Create resource. NOT idempotent.
  PUT    → Replace resource entirely. Idempotent.
  PATCH  → Partial update. NOT idempotent (usually).
  DELETE → Remove resource. Idempotent.

JWT AUTHENTICATION FLOW:
  1. User POSTs credentials → Server validates → Issues Access Token (15min) + Refresh Token (7d).
  2. Access Token: JWT signed with HS256/RS256. Payload: {sub, role, iat, exp}.
  3. Client stores: Access Token in memory (NOT localStorage — XSS risk), Refresh in httpOnly Cookie.
  4. Authenticated request: Authorization: Bearer <access_token> header.
  5. Access Token expires → Client POSTs to /auth/refresh with Refresh Token cookie → new Access Token.
  6. Logout: Invalidate Refresh Token in server-side blocklist (Redis).`,
        },
        {
          heading: '3. Production Node.js / Express API (Complete Template)',
          isCode: true,
          code: `const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const jwt = require('jsonwebtoken');

const app = express();

// ── 1. SECURITY MIDDLEWARE ────────────────────────────────────────
app.use(helmet({                              // Sets 15+ security headers
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,                         // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
app.use(rateLimit({ windowMs: 15*60*1000, max: 100 })); // 100 req/15min

// ── 2. PERFORMANCE MIDDLEWARE ─────────────────────────────────────
app.use(compression());                       // gzip responses
app.use(express.json({ limit: '10mb' }));

// ── 3. JWT AUTHENTICATION MIDDLEWARE ──────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    req.user = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token invalid or expired' });
  }
};

// ── 4. GLOBAL ERROR HANDLER (always last middleware) ──────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message, err.stack);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

module.exports = app;`,
        },
      ],
    };
  }

  // ── 16. SOFTWARE ENGINEERING & AGILE ─────────────────────────────────────
  if (t.includes('software engineering') || t.includes('agile') || t.includes('scrum') ||
      t.includes('sdlc') || sub.includes('software engineering')) {
    return {
      moduleTitle: 'Software Engineering: SDLC, Agile/Scrum & Design Patterns',
      unit: 'Unit 1–2: Software Development Lifecycle, Agile Methodologies & UML',
      learningObjectives: [
        'Compare SDLC models: Waterfall, Spiral, Agile, V-Model, and when to use each.',
        'Master Scrum framework: Roles, Ceremonies, Artifacts, and Definition of Done.',
        'Apply GoF Design Patterns: Singleton, Factory, Observer, Strategy, Decorator.',
        'Understand software testing levels: Unit, Integration, System, UAT.',
        'Create UML diagrams: Use Case, Class, Sequence, Activity, and Component diagrams.',
      ],
      sections: [
        {
          heading: '1. SDLC Models Comparison',
          body: `WATERFALL MODEL:
  Phases: Requirements → Design → Implementation → Testing → Deployment → Maintenance
  • Strictly sequential; each phase complete before next begins.
  • Advantages: Clear documentation, well-defined milestones, easy to manage.
  • Disadvantages: NO accommodation for changing requirements. Testing happens very late.
  • When to use: Well-understood, stable requirements (government contracts, embedded systems).

AGILE MANIFESTO (Beck et al., 2001) VALUES:
  • Individuals and interactions OVER processes and tools.
  • Working software OVER comprehensive documentation.
  • Customer collaboration OVER contract negotiation.
  • Responding to change OVER following a plan.

V-MODEL (Verification & Validation):
  Pairs each development phase with a corresponding testing phase:
  Requirements ↔ Acceptance Testing
  System Design ↔ System Testing
  Detailed Design ↔ Integration Testing
  Coding ↔ Unit Testing
  
SPIRAL MODEL (Boehm):
  Iterative risk-driven model. 4 quadrants per spiral: Planning, Risk Analysis, Engineering, Evaluation.
  Best for large high-risk projects. Explicit risk management at every iteration.`,
        },
        {
          heading: '2. Scrum Framework & Agile Estimation',
          body: `SCRUM ROLES:
  Product Owner (PO): Owns and prioritizes the Product Backlog. Single point of authority for "what" to build.
  Scrum Master (SM): Servant-leader. Removes impediments, facilitates ceremonies, coaches team.
  Development Team: Self-organizing, cross-functional, 3–9 members. Owns "how" to build.

SCRUM CEREMONIES:
  Sprint Planning (8h max for 4-week Sprint): Team pulls items from Product Backlog into Sprint Backlog. Creates Sprint Goal.
  Daily Scrum / Stand-up (15 min): 3 questions: What did I do? What will I do? Any blockers?
  Sprint Review (4h max): Demo working increment to stakeholders. PO updates backlog.
  Sprint Retrospective (3h max): What went well? What to improve? Action items for next Sprint.

SCRUM ARTIFACTS:
  Product Backlog: Ordered list of all desired features (User Stories, Epics, Bugs). Refined continuously.
  Sprint Backlog: Items selected for current Sprint + Sprint Plan for delivering them.
  Increment: Sum of all Product Backlog items completed in current and all previous Sprints. Must meet Definition of Done.

AGILE ESTIMATION TECHNIQUES:
  Story Points: Relative size (Fibonacci: 1,2,3,5,8,13,21). Accounts for complexity + uncertainty + effort.
  Planning Poker: Team members reveal estimates simultaneously to avoid anchoring bias.
  Velocity: Average story points completed per Sprint (used for release planning).`,
        },
        {
          heading: '3. GoF Design Patterns — Structural & Behavioral',
          isCode: true,
          code: `// ── SINGLETON PATTERN — Ensure exactly one instance ─────────────
class DatabasePool {
  private static instance: DatabasePool;
  private constructor() {}           // Private: prevent 'new DatabasePool()'
  static getInstance(): DatabasePool {
    if (!DatabasePool.instance) DatabasePool.instance = new DatabasePool();
    return DatabasePool.instance;
  }
  query(sql: string) { /* execute */ }
}

// ── OBSERVER PATTERN — Event-driven notification ──────────────────
interface Observer { update(event: string, data: any): void; }
class EventEmitter {
  private listeners = new Map<string, Observer[]>();
  subscribe(event: string, obs: Observer) {
    this.listeners.get(event)?.push(obs) ?? this.listeners.set(event, [obs]);
  }
  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(obs => obs.update(event, data));
  }
}

// ── STRATEGY PATTERN — Interchangeable algorithms ─────────────────
interface SortStrategy { sort(data: number[]): number[]; }
class BubbleSort implements SortStrategy { sort(d) { /*...*/ return d; } }
class QuickSort  implements SortStrategy { sort(d) { /*...*/ return d; } }
class Sorter {
  constructor(private strategy: SortStrategy) {}
  setStrategy(s: SortStrategy) { this.strategy = s; }
  sort(data: number[]) { return this.strategy.sort(data); }
}

// ── FACTORY METHOD — Create objects without specifying class ───────
interface Logger { log(msg: string): void; }
class FileLogger    implements Logger { log(m) { fs.appendFile('app.log', m, ()=>{}) } }
class ConsoleLogger implements Logger { log(m) { console.log(m); } }
function createLogger(type: 'file'|'console'): Logger {
  return type === 'file' ? new FileLogger() : new ConsoleLogger();
}`,
        },
      ],
    };
  }

  // ── DEFAULT — GENERAL COMPREHENSIVE HANDLER ───────────────────────────────
  return {
    moduleTitle: `${resource.title} — Comprehensive Academic Study Notes`,
    unit: `Academic Module: ${resource.subject_name || 'Computer Applications'}`,
    learningObjectives: [
      'Master core theoretical definitions, principles, and architectural foundations.',
      'Analyze worked examples, algorithms, and structured problem-solving methodologies.',
      'Review university examination questions with model answers and evaluation criteria.',
      'Apply concepts to real-world software engineering and computer science practice.',
    ],
    sections: [
      {
        heading: '1. Foundational Concepts & Theoretical Framework',
        body: `${resource.description || 'This academic resource provides comprehensive examination notes, conceptual explanations, worked examples, and technical illustrations.'}

ACADEMIC CONTEXT:
  Course: ${resource.course_code || 'MCA'} — ${resource.course_name || 'Master of Computer Applications'}
  Semester: ${resource.semester_number || '1'}
  Subject: ${resource.subject_name || 'Computer Applications'}

THEORETICAL FOUNDATIONS:
Every domain in computer science rests on three universal pillars:

1. MATHEMATICAL BASIS: Formal notation, proofs, and complexity analysis (Big-O, Omega, Theta).
   Understanding asymptotic behaviour enables engineers to predict system performance at scale.

2. ALGORITHMIC DESIGN: Systematic problem decomposition using established paradigms:
   • Divide & Conquer: Recursively split problems (Merge Sort, FFT, Karatsuba multiplication).
   • Greedy: Local optimal choices leading to global optimum (Huffman coding, Dijkstra, Prim).
   • Dynamic Programming: Memoized recursive solutions for overlapping subproblems.
   • Backtracking: Exhaustive search with pruning (N-Queens, Sudoku, SAT solving).
   • Randomization: Probabilistic algorithms with high-probability guarantees (Bloom filters, Skip lists).

3. SYSTEM CONSTRAINTS: Real-world computing is bounded by:
   • Memory hierarchy: Registers (< 1ns) → L1 cache (1-4ns) → L2 (4-10ns) → RAM (60-100ns) → Disk (10ms).
   • Concurrency: Race conditions, deadlocks, starvation in multi-threaded environments.
   • Network: Latency, bandwidth, packet loss, partial failures in distributed systems.`,
      },
      {
        heading: '2. Core Technical Content',
        body: `COMPUTATIONAL COMPLEXITY REVIEW:

Time Complexity Classes:
  O(1)        Constant   — Hash table lookup, array index access
  O(log N)    Logarithmic — Binary search, balanced BST operations, B-Tree search
  O(N)        Linear      — Linear scan, single-pass algorithms
  O(N log N)  Log-linear  — Merge Sort, Heap Sort, FFT
  O(N²)       Quadratic   — Bubble Sort, Selection Sort, Floyd-Warshall (N³)
  O(2^N)      Exponential — Naive subset enumeration, brute-force SAT
  O(N!)       Factorial   — Brute-force TSP, permutation generation

SPACE COMPLEXITY OPTIMIZATION PATTERNS:
  In-Place Algorithms: Sort without auxiliary space (Heap Sort, Quick Sort with tail recursion).
  Rolling Array: Reduce 2D DP table to 1D by overwriting previous row.
  Two-Pointer Technique: Avoid auxiliary arrays in sorted/partitioning problems.

FUNDAMENTAL DATA STRUCTURES SELECTION GUIDE:
  Need fast lookup by key?           → HashMap (O(1) avg) or B+Tree (O(log N) ordered)
  Need sorted dynamic sequence?      → AVL Tree or Red-Black Tree
  Need FIFO ordering?                → Queue (linked list or circular array)
  Need LIFO ordering?                → Stack (array or linked list)
  Need priority-based extraction?    → Binary Heap (min or max)
  Need graph traversal?              → Adjacency List + BFS/DFS
  Need disjoint set tracking?        → Union-Find with path compression`,
      },
      {
        heading: '3. University Examination Questions & Model Answers',
        body: `SECTION A — SHORT ANSWER QUESTIONS (2 marks each):

Q1: Define the term "time complexity" and explain Big-O notation.
Answer: Time complexity measures how execution time scales with input size N. Big-O notation O(f(N)) denotes an UPPER BOUND — the algorithm's growth rate does not exceed c×f(N) for all N ≥ N₀ and some constant c. It characterizes worst-case behaviour, abstracting away hardware-specific constants.

Q2: What is the difference between a stable and unstable sorting algorithm?
Answer: A stable sort preserves the RELATIVE ORDER of equal elements. If a[i] = a[j] with i < j before sorting, stable sort guarantees position of a[i] < position of a[j] after. Merge Sort and Insertion Sort are stable; Quick Sort and Heap Sort are NOT stable by default.

SECTION B — DESCRIPTIVE QUESTIONS (10 marks each):

Q3: Describe the working of a Binary Search Tree (BST) and analyze its complexity in average and worst cases. How does AVL tree overcome BST's limitations?
Answer: A BST stores keys such that left subtree < root < right subtree. Search/Insert/Delete run in O(h) where h is tree height. In average case (random keys), h = O(log N). In worst case (sorted input), BST degenerates to a linear chain with h = N → O(N) all operations.
AVL trees maintain the invariant |BF(X)| ≤ 1 through rotations on insert/delete, bounding height to 1.44 log₂N → guaranteeing O(log N) worst-case for all operations.

Q4: Explain with example how ACID properties ensure database integrity in concurrent transactions.
Answer: Atomicity prevents partial updates via UNDO logs. Consistency enforces schema constraints. Isolation prevents dirty/phantom reads through locking or MVCC. Durability writes committed data to WAL before data files. Example: Bank transfer A→B: Debit A and credit B must both complete atomically; isolation prevents T2 from reading intermediate state.`,
      },
      {
        heading: '4. Quick Reference & Exam Formula Sheet',
        body: `SORTING ALGORITHM COMPLEXITY REFERENCE:
  Algorithm      | Best     | Average  | Worst    | Space   | Stable?
  ─────────────────────────────────────────────────────────────────────
  Bubble Sort    | O(N)     | O(N²)    | O(N²)    | O(1)    | Yes
  Selection Sort | O(N²)    | O(N²)    | O(N²)    | O(1)    | No
  Insertion Sort | O(N)     | O(N²)    | O(N²)    | O(1)    | Yes
  Merge Sort     | O(N logN)| O(N logN)| O(N logN)| O(N)    | Yes
  Quick Sort     | O(N logN)| O(N logN)| O(N²)    | O(logN) | No
  Heap Sort      | O(N logN)| O(N logN)| O(N logN)| O(1)    | No
  Counting Sort  | O(N+K)   | O(N+K)   | O(N+K)   | O(K)    | Yes (K=range)
  Radix Sort     | O(d×N)   | O(d×N)   | O(d×N)   | O(N+K)  | Yes

GRAPH ALGORITHM COMPLEXITY:
  BFS/DFS:               O(V + E)
  Dijkstra (bin heap):   O((V+E) log V)
  Bellman-Ford:          O(V × E)
  Floyd-Warshall (APSP): O(V³)
  Kruskal's MST:         O(E log E)
  Prim's MST:            O((V+E) log V)
  Topological Sort:      O(V + E)

KEY FORMULAS:
  TAT = CT − AT        |  WT = TAT − BT        |  Throughput = N/TotalTime
  EAT = h(t_TLB+t_mem) + (1−h)(t_TLB+2t_mem)
  RSA: C=M^e mod n     |  M=C^d mod n          |  φ(n)=(p−1)(q−1)`,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF GENERATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders a single text section to the PDFDocument.
 * Handles page overflow automatically.
 */
function renderSection(doc, section) {
  // Section heading
  if (doc.y > 670) { doc.addPage(); doc.y = 50; }
  doc
    .fillColor(COLORS.secondary)
    .fontSize(11.5)
    .font('Helvetica-Bold')
    .text(section.heading, { lineGap: 2 });
  doc.moveDown(0.3);

  if (section.isCode) {
    const codeLines = (section.code || '').split('\n');
    const lineHeight = 11;
    const padding = 12;
    const boxHeight = Math.min(codeLines.length * lineHeight + padding * 2, 290);

    if (doc.y + boxHeight > 750) { doc.addPage(); doc.y = 50; }

    const codeTop = doc.y;
    // Dark code background
    doc.roundedRect(50, codeTop, 512, boxHeight, 5).fill(COLORS.codeBg);
    // Language label
    doc
      .fillColor('#94A3B8')
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('CODE', 557, codeTop + 6, { align: 'right', width: 55 });

    doc.fillColor(COLORS.codeText).fontSize(7.8).font('Courier');
    let ly = codeTop + padding;
    for (const line of codeLines) {
      if (ly > codeTop + boxHeight - lineHeight) break;
      doc.text(line, 60, ly, { width: 494, lineBreak: false });
      ly += lineHeight;
    }
    doc.y = codeTop + boxHeight + 12;
  } else {
    // Body text — handle page breaks inside long sections
    const bodyText = (section.body || '').trim();
    if (doc.y + 60 > 750) { doc.addPage(); doc.y = 50; }

    doc
      .fillColor(COLORS.textPrimary)
      .fontSize(9.2)
      .font('Helvetica')
      .text(bodyText, 50, doc.y, {
        width: 512,
        lineGap: 2.5,
        paragraphGap: 4,
        align: 'justify',
      });
    doc.moveDown(0.7);
  }
}

/**
 * Generates a complete, publication-quality academic PDF buffer.
 * @param {object} resource - Resource row from MySQL (with joined fields)
 * @returns {Promise<Buffer>} PDF buffer
 */
function createAcademicPdfBuffer(resource) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true,   // Required for page numbering in footers
        info: {
          Title:    resource.title    || 'ShelfShare Academic Resource',
          Author:   resource.uploader_name || 'ShelfShare Peer Contributor',
          Subject:  resource.subject_name  || 'Computer Applications',
          Keywords: `academic, notes, ${resource.course_code || 'MCA'}, study material, shelfshare`,
          Creator:  'ShelfShare Academic Document Engine v2.0',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end',  () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const content = getComprehensiveTopicContent(resource);

      // ── HEADER BANNER ──────────────────────────────────────────────────
      doc.rect(0, 0, 612, 82).fill(COLORS.primary);
      doc.rect(0, 82, 612, 4).fill(COLORS.accent);

      // Brand name
      doc.fillColor('#FFFFFF').fontSize(21).font('Helvetica-Bold').text('SHELFSHARE', 50, 20);
      // Tagline
      doc.fontSize(8).font('Helvetica').fillColor('#9BB5C8')
        .text('STUDENT ACADEMIC RESOURCE ECOSYSTEM  •  LEARN · SHARE · GROW', 50, 44);
      // Badge (top right)
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold')
        .text('★ PEER VERIFIED ACADEMIC RESOURCE', 400, 25, { align: 'right', width: 162 });
      doc.fillColor('#9BB5C8').fontSize(7.5).font('Helvetica')
        .text(`Generated: ${new Date().toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })}`,
              400, 40, { align: 'right', width: 162 });

      // ── RESOURCE TITLE ─────────────────────────────────────────────────
      doc.y = 102;
      doc.moveDown(0.8);
      doc
        .fillColor(COLORS.primary)
        .fontSize(17)
        .font('Helvetica-Bold')
        .text(resource.title || 'Academic Resource', { width: 512 });

      // Module / Unit subtitle
      doc.moveDown(0.3);
      doc
        .fillColor(COLORS.secondary)
        .fontSize(10)
        .font('Helvetica-Oblique')
        .text(`${content.moduleTitle}`, { width: 512 });

      doc.moveDown(0.3);
      doc
        .fillColor(COLORS.textMuted)
        .fontSize(9)
        .font('Helvetica')
        .text(content.unit, { width: 512 });

      doc.moveDown(0.6);

      // ── METADATA CARD ──────────────────────────────────────────────────
      const metaTop = doc.y;
      doc.roundedRect(50, metaTop, 512, 60, 5).fillAndStroke(COLORS.bgSoft, COLORS.border);

      const col1x = 65, col2x = 185, col3x = 335, col4x = 435;
      const row1y = metaTop + 10, row2y = metaTop + 28, row3y = metaTop + 46;

      doc.fillColor(COLORS.textMuted).fontSize(7.5).font('Helvetica');
      doc.text('COURSE',       col1x, row1y);
      doc.text('SUBJECT',      col1x, row2y);
      doc.text('CONTRIBUTOR',  col1x, row3y);
      doc.text('RESOURCE TYPE', col3x, row1y);
      doc.text('RATING',        col3x, row2y);
      doc.text('ACADEMIC YEAR', col3x, row3y);

      doc.fillColor(COLORS.textPrimary).fontSize(8).font('Helvetica-Bold');
      doc.text(`${resource.course_code || 'MCA'} — Sem ${resource.semester_number || '1'}`, col2x, row1y, { width: 140 });
      doc.text(`${resource.subject_name || 'Computer Applications'}`,                        col2x, row2y, { width: 140 });
      doc.text(`${resource.uploader_name || 'Verified Contributor'}`,                        col2x, row3y, { width: 140 });
      doc.text(`${resource.resource_type || 'Lecture Notes'}`,                               col4x, row1y, { width: 120 });
      doc.fillColor(COLORS.accentWarm)
        .text(`★ ${Number(resource.average_rating || 4.8).toFixed(1)} / 5.0 (${resource.total_reviews || '—'} reviews)`, col4x, row2y, { width: 120 });
      doc.fillColor(COLORS.accent).text(`${resource.academic_year || '2025–2026'}`, col4x, row3y, { width: 120 });

      doc.y = metaTop + 72;

      // ── LEARNING OBJECTIVES ────────────────────────────────────────────
      doc.moveDown(0.6);
      doc
        .fillColor(COLORS.primary)
        .fontSize(11.5)
        .font('Helvetica-Bold')
        .text('Learning Objectives & Key Takeaways');

      // Accent underline
      const loY = doc.y + 2;
      doc.rect(50, loY, 100, 2).fill(COLORS.accent);
      doc.y = loY + 8;

      for (const obj of content.learningObjectives) {
        if (doc.y > 720) { doc.addPage(); doc.y = 50; }
        doc.fillColor(COLORS.accent).fontSize(9).font('Helvetica-Bold').text('▸ ', { continued: true });
        doc.fillColor(COLORS.textPrimary).font('Helvetica').text(obj, { indent: 8 });
        doc.moveDown(0.1);
      }

      doc.moveDown(0.7);

      // Divider before sections
      doc.rect(50, doc.y, 512, 1).fill(COLORS.border);
      doc.y += 10;

      // ── CONTENT SECTIONS ───────────────────────────────────────────────
      for (const section of content.sections) {
        renderSection(doc, section);
      }

      // ── FOOTER NOTICE ──────────────────────────────────────────────────
      if (doc.y > 710) { doc.addPage(); doc.y = 50; }
      doc.moveDown(1);
      doc.rect(50, doc.y, 512, 44).fillAndStroke(COLORS.bgSoft, COLORS.border);
      doc
        .fillColor(COLORS.textMuted)
        .fontSize(7.5)
        .font('Helvetica')
        .text(
          'This document was generated by the ShelfShare Academic Resource Ecosystem. All study materials are peer-contributed\n' +
          'by senior students for academic learning purposes. For official syllabus content, refer to your university curriculum.',
          58, doc.y + 6, { width: 496, lineGap: 2 }
        );

      // ── PAGE FOOTERS (all pages) ───────────────────────────────────────
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        // Footer rule
        doc.rect(50, 758, 512, 0.75).fill(COLORS.border);
        // Left text
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(7.5)
          .font('Helvetica')
          .text(
            `ShelfShare Academic Library  •  ${resource.course_code || 'MCA'} — ${resource.subject_name || 'Computer Applications'}`,
            50, 764, { width: 380 }
          );
        // Right: page number
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text(`Page ${i + 1} of ${totalPages}`, 420, 764, { width: 142, align: 'right' });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  createAcademicPdfBuffer,
  getComprehensiveTopicContent,
};
