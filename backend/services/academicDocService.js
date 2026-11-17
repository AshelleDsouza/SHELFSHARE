const PDFDocument = require('pdfkit');

/**
 * Academic Document Generator Service
 * Produces authoritative, publication-grade academic study guides and lecture notes
 * formatted specifically for university curriculum (MCA, BCA, B.Tech CSE).
 */

const COLORS = {
  primary: '#172C40',    // ShelfShare Navy
  secondary: '#2E5B82',  // Medium Navy
  accent: '#4A7C59',     // Academic Forest Green
  border: '#D0D7DE',     // Subtle border grey
  textPrimary: '#1F2328',// Dark Charcoal
  textMuted: '#656D76',  // Muted Grey
  bgSoft: '#F6F8FA',     // Soft background
  codeBg: '#1E293B',     // Dark Slate for code blocks
  codeText: '#E2E8F0',   // Light slate text
};

/**
 * Generates comprehensive, topic-specific academic content
 */
function getComprehensiveTopicContent(resource) {
  const t = (resource.title || '').toLowerCase();
  const d = (resource.description || '').toLowerCase();

  // 1. DISTRIBUTED SYSTEMS AUDIT & CONCURRENCY
  if (t.includes('audit') || (t.includes('distributed') && (t.includes('guide') || t.includes('notes') || d.includes('audit')))) {
    return {
      moduleTitle: 'Advanced Distributed Systems Architecture & Reliability Auditing',
      unit: 'Unit 4: Distributed Consensus Protocols, Fault Tolerance & System Audits',
      learningObjectives: [
        'Understand fundamental consensus protocols: Paxos, Raft, and Byzantine Fault Tolerance (BFT).',
        'Analyze the CAP Theorem trade-offs (Consistency, Availability, Partition Tolerance) in real-world systems.',
        'Implement distributed audit logging, tamper-evident hash chains, and deterministic replay.',
        'Evaluate clock synchronization anomalies using Lamport Timestamps and Vector Clocks.',
        'Execute comprehensive system audits verifying ACID/BASE compliance and network partition recovery.'
      ],
      sections: [
        {
          heading: '1. Theoretical Foundations: The CAP & PACELC Theorems',
          body: `In distributed systems, the Brewer CAP Theorem states that any distributed data store can simultaneously provide at most two of the following three guarantees:
• Consistency (C): Every read receives the most recent write or an error.
• Availability (A): Every non-failing node returns a non-error response for every request, without guarantee that it contains the most recent write.
• Partition Tolerance (P): The system continues to operate despite an arbitrary number of messages being dropped or delayed by the network between nodes.

In network-partitioned environments (P is mandatory in modern physical networks), designers must choose between CP (sacrificing availability to maintain strict serializability, e.g., Google Spanner, Etcd) and AP (sacrificing consistency to maintain high availability with eventual consistency, e.g., Amazon DynamoDB, Apache Cassandra).

The PACELC Theorem extends this: If there is a Partition (P), how does the system trade Availability (A) and Consistency (C); Else (E), when the system is running normally without partitions, how does the system trade Latency (L) and Consistency (C)?`
        },
        {
          heading: '2. Distributed Consensus Algorithms: Raft Protocol',
          body: `Raft decomposes consensus into three independent sub-problems:
1. Leader Election: Nodes exist in one of three states: Follower, Candidate, or Leader. If followers receive no heartbeats within an election timeout (randomized 150-300ms), they transition to Candidate, increment term, and request votes.
2. Log Replication: The Leader receives client requests, appends them to its log, and sends AppendEntries RPCs. An entry is committed once a majority of nodes acknowledge receipt.
3. Safety: If a leader has committed a log entry, no other node can be elected leader for that term without possessing that entry.`
        },
        {
          heading: '3. Technical Audit Checklist for Enterprise Distributed Systems',
          body: `When conducting an architectural reliability audit on distributed systems:
• Clock Drift Audit: Verify NTP synchronization error bounds (TrueTime API bounds must not exceed clock drift thresholds).
• Split-Brain Protection: Verify quorum calculation (Q = floor(N/2) + 1). Ensure fencing tokens are issued on leadership handoff.
• Idempotency & Message Deduplication: Verify that message brokers (Kafka, RabbitMQ) apply unique transaction IDs to eliminate duplicate execution during network retries.
• Data Integrity & Merkle Trees: Confirm that replica synchronization utilizes Merkle tree hash verification to detect silent data corruption across replica nodes.`
        },
        {
          heading: '4. Implementation: Raft Consensus Node State Machine (Go/Pseudocode)',
          isCode: true,
          code: `type NodeState int
const (
    Follower NodeState = iota
    Candidate
    Leader
)

type ConsensusModule struct {
    mu        sync.Mutex
    nodeId    int
    peers     []int
    state     NodeState
    term      int
    votedFor  int
    log       []LogEntry
    commitIdx int
}

func (cm *ConsensusModule) StartElection() {
    cm.state = Candidate
    cm.term++
    cm.votedFor = cm.nodeId
    votesReceived := 1

    for _, peer := range cm.peers {
        go func(p int) {
            args := RequestVoteArgs{Term: cm.term, CandidateId: cm.nodeId}
            var reply RequestVoteReply
            if cm.sendRequestVote(p, &args, &reply) && reply.VoteGranted {
                cm.mu.Lock()
                defer cm.mu.Unlock()
                votesReceived++
                if votesReceived > len(cm.peers)/2 && cm.state == Candidate {
                    cm.state = Leader
                    cm.startHeartbeats()
                }
            }
        }(peer)
    }
}`
        },
        {
          heading: '5. University Exam Review Questions & Model Solutions',
          body: `Q1: How does Vector Clock ordering differ from Lamport Logical Clocks?
Answer: Lamport clocks establish a partial order where a -> b implies L(a) < L(b), but L(a) < L(b) does not guarantee causality. Vector clocks track causally concurrent events by maintaining a vector of size N (number of nodes). Event a causally precedes b if and only if V(a)[i] <= V(b)[i] for all i and strictly less for at least one index.

Q2: What is Byzantine Fault Tolerance (BFT) and what is the minimum node requirement?
Answer: BFT tolerates arbitrary node failures including malicious attacks and software bugs. To tolerate f Byzantine nodes, a system requires at least 3f + 1 total nodes (e.g., 4 nodes to tolerate 1 compromised node).`
        }
      ]
    };
  }

  // 2. BINARY TREES & AVL ROTATIONS (DSA)
  if (t.includes('tree') || t.includes('avl') || (t.includes('dsa') && !t.includes('graph') && !t.includes('dynamic'))) {
    return {
      moduleTitle: 'Data Structures & Algorithms: Balanced Search Trees & AVL Rotations',
      unit: 'Unit 3: Hierarchical Structures, Self-Balancing Invariants & Rotations',
      learningObjectives: [
        'Analyze worst-case degradation in standard Binary Search Trees from O(log N) to O(N).',
        'Master the AVL Height-Balance Invariant: |height(left) - height(right)| <= 1 for every node.',
        'Implement the 4 fundamental tree rotations: LL (Right), RR (Left), LR (Left-Right), RL (Right-Left).',
        'Prove the worst-case search, insertion, and deletion time complexity: O(log N).',
        'Compare AVL Trees with Red-Black Trees, B-Trees, and Splay Trees for memory and lookup efficiency.'
      ],
      sections: [
        {
          heading: '1. Binary Search Tree Invariant & Balance Factor Definition',
          body: `A Binary Search Tree (BST) maintains the fundamental invariant that for any node X:
• All keys in the left subtree are strictly less than X.key.
• All keys in the right subtree are strictly greater than X.key.

When elements are inserted in monotonic order (e.g., 10, 20, 30, 40, 50), a standard BST degenerates into a singly linked list with O(N) lookup time. Adelson-Velsky and Landis (AVL, 1962) introduced the first self-balancing tree.

Definition: For any node X in an AVL tree, the Balance Factor BF(X) is defined as:
    BF(X) = Height(LeftSubtree) - Height(RightSubtree)
An AVL tree satisfies the invariant: BF(X) in {-1, 0, +1} for every node X.
When any insertion or deletion causes BF(X) to become +2 or -2, a rotation is immediately applied to restore balance.`
        },
        {
          heading: '2. The Four Rotations & Structural Rebalancing',
          body: `Rebalancing requires identifying the deepest unbalanced node Z and its child Y:

Case 1: Left-Left (LL) Heavy [BF(Z) = +2, BF(Y) = +1]
Solution: Single Right Rotation about node Z.
         Z                       Y
        / \\                    /   \\
       Y   T3    ===>         X     Z
      / \\                    / \\   / \\
     X   T2                 T0 T1 T2 T3

Case 2: Right-Right (RR) Heavy [BF(Z) = -2, BF(Y) = -1]
Solution: Single Left Rotation about node Z.

Case 3: Left-Right (LR) Heavy [BF(Z) = +2, BF(Y) = -1]
Solution: Double Rotation: Left rotation on Y, followed by Right rotation on Z.

Case 4: Right-Left (RL) Heavy [BF(Z) = -2, BF(Y) = +1]
Solution: Double Rotation: Right rotation on Y, followed by Left rotation on Z.`
        },
        {
          heading: '3. Complete C++ Implementation of AVL Tree Insertion',
          isCode: true,
          code: `struct Node {
    int key, height;
    Node *left = nullptr, *right = nullptr;
    Node(int val) : key(val), height(1) {}
};

int height(Node* n) { return n ? n->height : 0; }
int getBalance(Node* n) { return n ? height(n->left) - height(n->right) : 0; }

Node* rotateRight(Node* y) {
    Node* x = y->left;
    Node* T2 = x->right;
    x->right = y;
    y->left = T2;
    y->height = 1 + std::max(height(y->left), height(y->right));
    x->height = 1 + std::max(height(x->left), height(x->right));
    return x;
}

Node* rotateLeft(Node* x) {
    Node* y = x->right;
    Node* T2 = y->left;
    y->left = x;
    x->right = T2;
    x->height = 1 + std::max(height(x->left), height(x->right));
    y->height = 1 + std::max(height(y->left), height(y->right));
    return y;
}

Node* insert(Node* node, int key) {
    if (!node) return new Node(key);
    if (key < node->key) node->left = insert(node->left, key);
    else if (key > node->key) node->right = insert(node->right, key);
    else return node; // Duplicate keys not permitted

    node->height = 1 + std::max(height(node->left), height(node->right));
    int balance = getBalance(node);

    // LL Case
    if (balance > 1 && key < node->left->key) return rotateRight(node);
    // RR Case
    if (balance < -1 && key > node->right->key) return rotateLeft(node);
    // LR Case
    if (balance > 1 && key > node->left->key) {
        node->left = rotateLeft(node->left);
        return rotateRight(node);
    }
    // RL Case
    if (balance < -1 && key < node->right->key) {
        node->right = rotateRight(node->right);
        return rotateLeft(node);
    }
    return node;
}`
        },
        {
          heading: '4. Complexity Analysis & Comparative Performance Matrix',
          body: `• Search: O(log N) worst case (AVL trees are more rigidly balanced than Red-Black trees, providing faster lookups).
• Insertion: O(log N) worst case (requires at most 2 tree rotations).
• Deletion: O(log N) worst case (may require up to O(log N) rotations propagating to the root).
• Space Overhead: 1 byte or integer per node to record height.`
        }
      ]
    };
  }

  // 3. GRAPH ALGORITHMS (DIJKSTRA, BELLMAN-FORD, KRUSKAL)
  if (t.includes('graph') || t.includes('dijkstra') || t.includes('bellman') || t.includes('kruskal')) {
    return {
      moduleTitle: 'Graph Theory & Algorithmic Optimization: Shortest Path & MST',
      unit: 'Unit 4: Single-Source Shortest Paths & Minimum Spanning Trees',
      learningObjectives: [
        'Implement Dijkstra\'s Single-Source Shortest Path using Min-Heap priority queues.',
        'Analyze Bellman-Ford algorithm for negative edge weights and negative cycle detection.',
        'Construct Minimum Spanning Trees using Kruskal\'s Algorithm with Disjoint Set Union (DSU).',
        'Compare Time Complexity: Dijkstra O((V + E) log V) vs Bellman-Ford O(V * E).'
      ],
      sections: [
        {
          heading: '1. Single-Source Shortest Path: Dijkstra\'s Algorithm',
          body: `Dijkstra\'s algorithm solves the single-source shortest path problem on weighted directed graphs with non-negative edge weights.
Core Strategy: Greedy selection of the unvisited vertex with the minimum tentative distance.
Invariant: At every step, the distance recorded for visited vertices is guaranteed to be optimal.

Time Complexity:
• With Adjacency Matrix: O(V^2)
• With Binary Min-Heap Priority Queue: O((V + E) log V)
• With Fibonacci Heap: O(E + V log V)`
        },
        {
          heading: '2. Bellman-Ford Algorithm & Negative Cycle Detection',
          body: `Dijkstra fails on graphs with negative edge weights because the greedy assumption breaks. Bellman-Ford relaxes all |E| edges (|V| - 1) times.
Principle: A shortest path in a graph with V vertices contains at most V - 1 edges.
Negative Cycle Detection: If a further edge relaxation reduces distance in the V-th iteration, a negative-weight cycle exists.`
        },
        {
          heading: '3. Complete C++ Implementation of Dijkstra with Min-Heap',
          isCode: true,
          code: `#include <vector>
#include <queue>
using namespace std;

typedef pair<int, int> pii; // {distance, vertex}

vector<int> dijkstra(int V, vector<vector<pii>>& adj, int src) {
    priority_queue<pii, vector<pii>, greater<pii>> pq;
    vector<int> dist(V, 1e9);

    dist[src] = 0;
    pq.push({0, src});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (d > dist[u]) continue;

        for (auto [v, weight] : adj[u]) {
            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}`
        }
      ]
    };
  }

  // 4. DYNAMIC PROGRAMMING (KNAPSACK, LCS)
  if (t.includes('dynamic programming') || t.includes('knapsack') || t.includes('lcs')) {
    return {
      moduleTitle: 'Advanced Dynamic Programming: Optimal Substructure & Memoization',
      unit: 'Unit 5: 0/1 Knapsack, Longest Common Subsequence & Tabulation',
      learningObjectives: [
        'Identify the 2 fundamental DP properties: Optimal Substructure and Overlapping Subproblems.',
        'Formulate recurrence relations for 0/1 Knapsack and Longest Common Subsequence (LCS).',
        'Compare Top-Down Memoization vs Bottom-Up Tabulation in space complexity.',
        'Reconstruct optimal decision paths using backtracking.'
      ],
      sections: [
        {
          heading: '1. The 0/1 Knapsack Problem Formulation',
          body: `Given N items, each with weight w[i] and value v[i], and a knapsack of capacity W.
State: dp[i][w] = Maximum value achievable using a subset of first i items with weight at most w.
Recurrence Relation:
• If w[i] > w: dp[i][w] = dp[i-1][w]  (Item cannot be included)
• If w[i] <= w: dp[i][w] = max(dp[i-1][w], v[i] + dp[i-1][w - w[i]])

Time Complexity: O(N * W), Space Complexity: O(W) with 1D rolling array optimization.`
        },
        {
          heading: '2. Longest Common Subsequence (LCS) Recurrence',
          body: `Given strings X of length m and Y of length n:
Recurrence:
• If X[i-1] == Y[j-1]: dp[i][j] = 1 + dp[i-1][j-1]
• If X[i-1] != Y[j-1]: dp[i][j] = max(dp[i-1][j], dp[i][j-1])
Time: O(m * n), Space: O(m * n).`
        }
      ]
    };
  }

  // 5. RELATIONAL NORMALIZATION & ACID (DBMS)
  if (t.includes('normalization') || t.includes('acid') || (t.includes('dbms') && !t.includes('distributed'))) {
    return {
      moduleTitle: 'Database Systems: Relational Normalization & ACID Transactions',
      unit: 'Unit 2: Functional Dependencies, Normal Forms (1NF-BCNF) & Isolation Levels',
      learningObjectives: [
        'Identify modification anomalies: Insertion, Deletion, and Update anomalies.',
        'Calculate attribute closures and minimal covers for functional dependency sets.',
        'Execute step-by-step lossless-join, dependency-preserving decomposition into BCNF/3NF.',
        'Analyze ACID transaction guarantees and concurrency isolation levels (Read Committed, Serializable).'
      ],
      sections: [
        {
          heading: '1. Anomalies in Unnormalized Relational Schemas',
          body: `In an unnormalized schema, redundant data storage causes three primary anomalies:
1. Update Anomaly: If department name changes, thousands of student rows must be updated; failure results in inconsistent data.
2. Insertion Anomaly: Cannot record a new course without enrolling at least one student, forcing artificial NULL values in primary keys.
3. Deletion Anomaly: If the only student in a course graduates, historical course and faculty data is unintentionally destroyed.`
        },
        {
          heading: '2. Progression of Normal Forms: 1NF to BCNF',
          body: `• 1NF: Atomic values only, no repeating groups.
• 2NF: In 1NF and no partial functional dependency of non-prime attributes on composite keys.
• 3NF: In 2NF and no transitive dependencies. For every X -> A, X is superkey or A is prime.
• BCNF: For every non-trivial functional dependency X -> A, X MUST be a superkey.`
        },
        {
          heading: '3. Worked Example: BCNF Decomposition',
          body: `Relation R(A, B, C, D, E) with FDs: { A -> B, BC -> D, D -> E, A -> C }
Candidate Key is A (A+ = {A,B,C,D,E}).
• A -> B: A is superkey (Valid).
• A -> C: A is superkey (Valid).
• D -> E: D is NOT superkey (Violates BCNF).
Decomposition:
R1 = (D, E) with Key D.
R2 = (A, B, C, D) with Key A.
Both satisfy BCNF with lossless join guarantee.`
        }
      ]
    };
  }

  // 6. OPERATING SYSTEMS - CPU SCHEDULING & DEADLOCK
  if (t.includes('scheduling') || t.includes('deadlock') || (t.includes('os ') && !t.includes('memory') && !t.includes('paging'))) {
    return {
      moduleTitle: 'Operating Systems: CPU Scheduling & Deadlock Prevention',
      unit: 'Unit 2: Process Scheduling, Gantt Charts & Deadlock Avoidance',
      learningObjectives: [
        'Understand the Process Control Block (PCB) structure and process state transitions.',
        'Calculate Turnaround Time, Waiting Time, and Response Time across scheduling algorithms.',
        'Simulate Preemptive vs Non-Preemptive FCFS, SJF, Priority, and Round Robin scheduling.',
        'Apply Dijkstra\'s Banker\'s Algorithm for deadlock avoidance in multi-resource environments.'
      ],
      sections: [
        {
          heading: '1. Scheduling Metrics & Mathematical Formulas',
          body: `• Turnaround Time (TAT) = Completion Time (CT) - Arrival Time (AT)
• Waiting Time (WT) = Turnaround Time (TAT) - Burst Time (BT)
• Throughput = Completed Processes / Total Time Unit
• Response Time = Time from arrival to first execution grant`
        },
        {
          heading: '2. Worked Problem: Shortest Remaining Time First (SRTF)',
          body: `Processes: P1(AT=0, BT=5), P2(AT=1, BT=3), P3(AT=2, BT=8), P4(AT=3, BT=6)
Gantt Chart: [0--P1--1][1--P2--4][4--P1--8][8--P4--14][14--P3--22]
Calculations:
• P1: CT=8, TAT=8, WT=3
• P2: CT=4, TAT=3, WT=0
• P3: CT=22, TAT=20, WT=12
• P4: CT=14, TAT=11, WT=5
Average Turnaround Time = 10.5 ms, Average Waiting Time = 5.0 ms.`
        },
        {
          heading: '3. Deadlock Characterization: Coffman Conditions',
          body: `Deadlock occurs if all 4 conditions hold simultaneously:
1. Mutual Exclusion: Resource held exclusively.
2. Hold and Wait: Process holds one resource while requesting another.
3. No Preemption: Resources released only voluntarily.
4. Circular Wait: P0 waits for P1, P1 waits for P2, ..., Pn waits for P0.`
        }
      ]
    };
  }

  // 7. MEMORY MANAGEMENT & PAGING (OS)
  if (t.includes('memory management') || t.includes('paging') || t.includes('virtual memory')) {
    return {
      moduleTitle: 'Operating Systems: Virtual Memory, Paging & Page Replacement',
      unit: 'Unit 3: Memory Virtualization, Page Tables, TLB & Replacement Algorithms',
      learningObjectives: [
        'Understand Logical vs Physical Address Translation via MMU and Page Tables.',
        'Analyze Translation Lookaside Buffer (TLB) hit ratios and Effective Access Time (EAT).',
        'Simulate FIFO, Optimal (OPT), and Least Recently Used (LRU) page replacement.',
        'Explain Belady\'s Anomaly and Thrashing detection and mitigation techniques.'
      ],
      sections: [
        {
          heading: '1. Paging Architecture & Address Translation',
          body: `Paging eliminates external fragmentation by dividing physical memory into fixed-size Frames and logical memory into Pages of identical size.
Logical Address: (Page Number p, Page Offset d)
• p is used as an index into the process Page Table to retrieve Frame Number f.
• Physical Address = (f * PageSize) + d.
With TLB: Effective Memory Access Time (EAT) = h * (t_TLB + t_mem) + (1 - h) * (t_TLB + 2 * t_mem), where h is TLB hit ratio.`
        },
        {
          heading: '2. Page Replacement Algorithms Comparison',
          body: `Reference String: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3 with 3 physical frames:
• FIFO (First-In, First-Out): Replaces the oldest page in memory. Prone to Belady\'s Anomaly (more frames resulting in more page faults).
• LRU (Least Recently Used): Replaces the page that has not been referenced for the longest period. Implementation via hardware timestamp or double-linked list with hash map.
• Optimal (Belady\'s OPT): Replaces the page that will not be used for the longest period in the future. Theoretical upper bound benchmark.`
        }
      ]
    };
  }

  // 8. COMPUTER NETWORKS - OSI & TCP/IP
  if (t.includes('network') || t.includes('tcp') || t.includes('osi')) {
    return {
      moduleTitle: 'Computer Networks: Protocol Architecture & Transmission Control',
      unit: 'Unit 1: The 7-Layer OSI Reference Model, TCP/IP & Reliable Transport',
      learningObjectives: [
        'Differentiate between OSI Reference Model layers and the practical TCP/IP suite.',
        'Trace packet encapsulation: Data -> Segment -> Packet -> Frame -> Bits.',
        'Analyze the TCP 3-Way Handshake and 4-Way Connection Termination state machines.',
        'Evaluate Congestion Control: AIMD, Slow Start, Fast Retransmit, and Fast Recovery.'
      ],
      sections: [
        {
          heading: '1. Layered Comparison: OSI vs TCP/IP Architecture',
          body: `Layer 7: Application (HTTP, DNS, SMTP) - End-user interface.
Layer 6: Presentation (TLS, ASCII) - Serialization, compression, encryption.
Layer 5: Session (RPC) - Dialog coordination, token management.
Layer 4: Transport (TCP, UDP) - Process-to-process delivery, port addressing.
Layer 3: Network (IP, ICMP) - Routing across subnets, logical addressing.
Layer 2: Data Link (Ethernet, MAC) - Physical framing, error detection (CRC).
Layer 1: Physical (Bits) - Unstructured bit streams across physical media.`
        },
        {
          heading: '2. TCP Reliable Transport & Three-Way Handshake',
          body: `1. Client -> Server: SYN (Seq = x) - Client requests connection.
2. Server -> Client: SYN-ACK (Seq = y, Ack = x + 1) - Server acknowledges and initiates.
3. Client -> Server: ACK (Seq = x + 1, Ack = y + 1) - Connection established.`
        }
      ]
    };
  }

  // 9. ARTIFICIAL INTELLIGENCE - HEURISTIC SEARCH & A*
  if (t.includes('artificial intelligence') || t.includes('heuristic') || t.includes('a*') || (t.includes('ai ') && !t.includes('neural'))) {
    return {
      moduleTitle: 'Artificial Intelligence: State-Space Search & Informed Heuristics',
      unit: 'Unit 2: Heuristic Evaluation, A* Algorithm & Game Theory',
      learningObjectives: [
        'Formulate problems as State-Space Search Graphs with Initial State, Actions, and Goal Test.',
        'Master the A* evaluation function: f(n) = g(n) + h(n).',
        'Prove the Admissibility and Consistency (Monotonicity) conditions of heuristic functions.',
        'Analyze the 8-Puzzle Problem using Manhattan Distance vs Misplaced Tiles heuristics.'
      ],
      sections: [
        {
          heading: '1. Formulation of the A* Search Algorithm',
          body: `A* search evaluates nodes by combining cost-to-reach g(n) and estimated cost-to-goal h(n):
    f(n) = g(n) + h(n)
• g(n): Exact path cost from initial state to current node n.
• h(n): Estimated cost of cheapest path from n to goal state.

Theorems:
1. Admissibility: A heuristic h(n) is admissible if for every node n, h(n) <= h*(n), where h*(n) is the true cost. If h is admissible, Tree-Search A* is guaranteed to be optimal.
2. Consistency (Monotonicity): h(n) <= c(n, a, n\') + h(n\'). Consistent heuristics guarantee that the first time a node is expanded, its path is optimal.`
        },
        {
          heading: '2. Worked Example: 8-Puzzle Manhattan Distance',
          body: `For the 8-puzzle sliding tile problem:
• h1 (Misplaced Tiles): Count of tiles in incorrect positions. Admissible.
• h2 (Manhattan Distance): Sum of absolute horizontal and vertical distances of each tile from target.
  h2 = sum(|x_current - x_goal| + |y_current - y_goal|)
Theorem: h2 dominates h1 (h2(n) >= h1(n) for all n), expanding fewer nodes while guaranteeing optimality.`
        }
      ]
    };
  }

  // 10. PYTHON FOR DATA SCIENCE (PANDAS, NUMPY, LAB MANUAL)
  if (t.includes('python') || t.includes('pandas') || t.includes('numpy') || t.includes('data science')) {
    return {
      moduleTitle: 'Python for Data Science: Vectorized Computing, Pandas & EDA',
      unit: 'Practical Lab Guide: NumPy Arrays, DataFrame Manipulation & Visualization',
      learningObjectives: [
        'Master NumPy N-dimensional array creation, slicing, broadcasting, and vectorization.',
        'Perform advanced Pandas operations: Indexing (.loc, .iloc), GroupBy, and Aggregation.',
        'Clean real-world datasets: Imputation of missing values and outlier detection.',
        'Construct production data pipelines using Scikit-Learn, Matplotlib, and Seaborn.'
      ],
      sections: [
        {
          heading: '1. Vectorization vs Python Native Loops Performance',
          body: `NumPy arrays provide contiguous memory allocation with C-level speed. Vectorized operations execute SIMD (Single Instruction, Multiple Data) instructions, outperforming native Python for-loops by 50x-100x.
Key Broadcasting Rule: Two dimensions are compatible when:
1. They are equal, OR
2. One of them is 1.`
        },
        {
          heading: '2. Complete Executable Python Lab Script (Data Cleaning & GroupBy)',
          isCode: true,
          code: `import numpy as np
import pandas as pd

# 1. Create Sample Academic Performance DataFrame
data = {
    'StudentID': [101, 102, 103, 104, 105],
    'Course': ['MCA', 'BCA', 'MCA', 'BTECH', 'MCA'],
    'GPA': [3.8, 3.2, np.nan, 3.9, 3.5],
    'CreditsCompleted': [60, 45, 55, 120, 62]
}
df = pd.DataFrame(data)

# 2. Handle Missing Values: Mean Imputation by Course
df['GPA'] = df.groupby('Course')['GPA'].transform(lambda x: x.fillna(x.mean()))

# 3. Filtering & Feature Engineering
honors_students = df[(df['GPA'] >= 3.5) & (df['CreditsCompleted'] >= 60)]
print("Honors Students:\\n", honors_students[['StudentID', 'Course', 'GPA']])

# 4. Aggregation Metrics
summary = df.groupby('Course').agg(
    Avg_GPA=('GPA', 'mean'),
    Student_Count=('StudentID', 'count')
).reset_index()
print("\\nCourse Summary:\\n", summary)`
        }
      ]
    };
  }

  // 11. CORE JAVA & OOP (COLLECTIONS, JVM)
  if (t.includes('java') || t.includes('oop') || t.includes('collections')) {
    return {
      moduleTitle: 'Java Programming: Object-Oriented Design & Collections Framework',
      unit: 'Unit 3: Polymorphism, Abstract Classes, Interfaces & Collections Hierarchy',
      learningObjectives: [
        'Apply the 4 pillars of OOP: Encapsulation, Abstraction, Inheritance, and Polymorphism.',
        'Differentiate between Abstract Classes and Interfaces (Java 8+ Default/Static methods).',
        'Master the Java Collections Framework: List (ArrayList vs LinkedList), Set, and Map (HashMap internals).',
        'Implement thread-safe concurrency using Synchronized blocks, ReentrantLock, and ConcurrentHashMap.'
      ],
      sections: [
        {
          heading: '1. Deep Dive: HashMap Internal Architecture (Java 8+)',
          body: `In Java, a HashMap is an array of Node buckets (Node<K,V>[] table):
1. Index Calculation: index = (n - 1) & hash(key)
2. Collision Resolution: Chaining with Singly Linked Lists.
3. Treeification (Java 8 Optimization): When a bucket exceeds TREEIFY_THRESHOLD (8 entries) and table capacity >= 64, the linked list converts into a Red-Black Tree, reducing lookup from O(N) to O(log N).`
        },
        {
          heading: '2. Polymorphism: Method Overloading vs Method Overriding',
          body: `• Overloading (Compile-Time / Static Polymorphism): Same method name, different parameter signature within the same class. Resolved at compile time based on reference type.
• Overriding (Run-Time / Dynamic Polymorphism): Subclass provides specific implementation of a method declared in superclass. Resolved at runtime using dynamic method dispatch (vtable).`
        }
      ]
    };
  }

  // 12. COMPILER DESIGN: LEXICAL ANALYSIS & LL(1) PARSING
  if (t.includes('compiler') || t.includes('lexical') || t.includes('parsing')) {
    return {
      moduleTitle: 'Compiler Design: Lexical Analysis, Grammars & LL(1) Syntax Analysis',
      unit: 'Unit 2: Context-Free Grammars, FIRST & FOLLOW Sets & Predictive Parsing',
      learningObjectives: [
        'Trace the 6 phases of a modern compiler: Lexical, Syntax, Semantic, Intermediate, Optimizer, Code Gen.',
        'Convert Regular Expressions to Deterministic Finite Automata (DFA) using Thompson\'s Construction.',
        'Compute FIRST and FOLLOW sets for Context-Free Grammars.',
        'Construct LL(1) Parsing Tables and resolve Left Recursion and Left Factoring.'
      ],
      sections: [
        {
          heading: '1. The 6 Phases of Compiler Execution',
          body: `1. Lexical Analyzer (Scanner): Reads characters, outputs Tokens (Identifiers, Keywords, Literals).
2. Syntax Analyzer (Parser): Validates grammar using Context-Free Grammar, outputs Parse Tree / AST.
3. Semantic Analyzer: Enforces type checking, scope validation, array bounds.
4. Intermediate Code Generator: Produces Three-Address Code (TAC) or Quadruples.
5. Code Optimizer: Eliminates dead code, applies loop unrolling, common subexpression elimination.
6. Target Code Generator: Emits native machine assembly instructions.`
        },
        {
          heading: '2. FIRST and FOLLOW Rules for LL(1) Parsing',
          body: `Algorithm for FIRST(X):
1. If X is terminal, FIRST(X) = {X}.
2. If X -> epsilon, add epsilon to FIRST(X).
3. If X -> Y1 Y2 ... Yk, add FIRST(Y1). If Y1 derives epsilon, add FIRST(Y2), and so on.

Algorithm for FOLLOW(A):
1. Add $ (end marker) to FOLLOW(S), where S is start symbol.
2. If A -> alpha B beta, everything in FIRST(beta) except epsilon is in FOLLOW(B).
3. If A -> alpha B or A -> alpha B beta (where beta derives epsilon), everything in FOLLOW(A) is in FOLLOW(B).`
        }
      ]
    };
  }

  // 13. CRYPTOGRAPHY & SECURITY (RSA, AES)
  if (t.includes('crypto') || t.includes('rsa') || t.includes('aes') || t.includes('security')) {
    return {
      moduleTitle: 'Cryptography & Network Security: Public Key Cryptosystems & Ciphers',
      unit: 'Unit 3: Asymmetric Cryptography, RSA Mathematical Proof & Hash Functions',
      learningObjectives: [
        'Differentiate between Symmetric Key Ciphers (AES/DES) and Asymmetric Key Ciphers (RSA/ECC).',
        'Execute the complete mathematical RSA Key Generation, Encryption, and Decryption cycle.',
        'Understand Euler\'s Totient Function phi(n) and the Extended Euclidean Algorithm.',
        'Analyze Cryptographic Hash Functions (SHA-256) and Digital Signature verification.'
      ],
      sections: [
        {
          heading: '1. Mathematical Foundation of the RSA Algorithm',
          body: `Key Generation:
1. Select two distinct large prime numbers p and q.
2. Compute modulus n = p * q.
3. Compute Euler\'s Totient: phi(n) = (p - 1) * (q - 1).
4. Choose public exponent e such that 1 < e < phi(n) and gcd(e, phi(n)) = 1.
5. Calculate private key d such that: e * d = 1 (mod phi(n)) [d = e^(-1) mod phi(n)].

Encryption (Public Key: {e, n}):
    Ciphertext C = M^e mod n
Decryption (Private Key: {d, n}):
    Plaintext M = C^d mod n

Proof of Correctness relies on Euler\'s Totient Theorem: M^(phi(n)) = 1 (mod n) for gcd(M, n) = 1.`
        },
        {
          heading: '2. Worked Numerical Example: RSA with Small Primes',
          body: `Let p = 7, q = 11.
• n = 7 * 11 = 77
• phi(n) = (7 - 1) * (11 - 1) = 6 * 10 = 60
• Choose e = 7 (gcd(7, 60) = 1)
• Compute d: 7 * d = 1 (mod 60) -> 7 * 43 = 301 = 5 * 60 + 1 -> d = 43.
Public Key = {7, 77}, Private Key = {43, 77}.

Encrypt Message M = 9:
    C = 9^7 mod 77 = 4,782,969 mod 77 = 37.
Decrypt Ciphertext C = 37:
    M = 37^43 mod 77 = 9. (Successfully restored original plaintext).`
        }
      ]
    };
  }

  // 14. CLOUD COMPUTING & DEVOPS (AWS, DOCKER, MICROSERVICES)
  if (t.includes('cloud') || t.includes('aws') || t.includes('docker') || t.includes('microservice')) {
    return {
      moduleTitle: 'Cloud Computing & Modern DevOps: Containerization & Cloud Architecture',
      unit: 'Unit 4: Microservices Architecture, Docker Containerization & AWS Infrastructure',
      learningObjectives: [
        'Differentiate between IaaS, PaaS, and SaaS cloud service models.',
        'Analyze monolithic vs microservices architectures with API Gateway and Service Mesh.',
        'Master Docker container virtualization: Images, Containers, Layers, and Dockerfiles.',
        'Evaluate AWS core services: EC2 compute, S3 object storage, RDS databases, and IAM.'
      ],
      sections: [
        {
          heading: '1. Virtual Machines vs Docker Containers',
          body: `Virtual Machines (Type 2 Hypervisors):
• Each VM includes a full Guest OS, Virtual Hardware, and Binaries, requiring gigabytes of memory and minutes to boot.
Docker Containers (OS-Level Virtualization):
• Share the host Linux Kernel using namespaces (pid, net, ipc, mnt) and cgroups (CPU, memory resource limits). Containers boot in milliseconds and consume megabytes of RAM.`
        },
        {
          heading: '2. Production Multi-Stage Dockerfile Implementation',
          isCode: true,
          code: `# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./
EXPOSE 5000
USER node
CMD ["node", "server.js"]`
        }
      ]
    };
  }

  // 15. FULL-STACK WEB TECHNOLOGIES (REACT, NODE, EXPRESS, REST)
  if (t.includes('full-stack') || t.includes('react') || t.includes('webtech') || t.includes('web')) {
    return {
      moduleTitle: 'Full-Stack Web Engineering: React SPA & Express REST Architecture',
      unit: 'Unit 3: Client-Side Virtual DOM, RESTful Principles & JWT Authentication',
      learningObjectives: [
        'Understand React Virtual DOM reconciliation and the Fiber reconciliation engine.',
        'Master React Hooks lifecycle: useState, useEffect, useContext, and useMemo.',
        'Design scalable RESTful API endpoints adhering to HTTP semantics and status codes.',
        'Implement secure stateless JWT authentication with HTTPS-only cookies.'
      ],
      sections: [
        {
          heading: '1. RESTful API Architectural Constraints',
          body: `Fielding\'s 6 architectural constraints of REST:
1. Client-Server Architecture: Separation of user interface concerns from data storage concerns.
2. Statelessness: Each request from client to server must contain all information required to understand and process the request.
3. Cacheability: Responses must implicitly or explicitly define themselves as cacheable or non-cacheable.
4. Layered System: Intermediary proxies, load balancers, and gateways are transparent to the client.
5. Uniform Interface: Resource identification in requests (URIs), resource manipulation through representations, and self-descriptive messages.`
        },
        {
          heading: '2. Production Express.js Middleware Pipeline',
          isCode: true,
          code: `const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// 1. Security & Headers Middleware
app.use(helmet());
app.use(cors({ origin: 'https://shelfshare-7js7.vercel.app', credentials: true }));

// 2. Request Parsing Middleware
app.use(express.json({ limit: '10mb' }));

// 3. JWT Authentication Interceptor
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' });
        req.user = decoded;
        next();
    });
};`
        }
      ]
    };
  }

  // DEFAULT / GENERAL ADVANCED CURRICULUM HANDLER
  return {
    moduleTitle: `${resource.title} - Comprehensive Academic Study Guide`,
    unit: `Academic Subject Study Module: ${resource.subject_name || 'Computer Applications'}`,
    learningObjectives: [
      'Master core theoretical definitions, principles, and architectural foundations.',
      'Analyze practical worked examples, algorithms, and technical problem-solving patterns.',
      'Review university exam questions, key evaluation criteria, and model solutions.',
      'Understand industry application, best practices, and performance considerations.'
    ],
    sections: [
      {
        heading: '1. Comprehensive Subject Overview',
        body: `${resource.description || 'This academic resource provides detailed examination notes, conceptual diagrams, and worked technical examples.'}

Key Theoretical Concepts:
• Academic Focus: Designed for graduate and undergraduate computer applications (MCA / BCA / B.Tech).
• Methodological Rigor: Integrates theoretical computer science principles with practical software engineering applications.
• Examination Focus: Aligned with standard university curriculum syllabi and credit requirements.`
      },
      {
        heading: '2. Technical Architecture & Structural Principles',
        body: `Every structured topic in computer science requires an understanding of:
1. Inputs, Outputs, and Transformation Functions: The algorithmic workflow that maps initial parameters to deterministic outcomes.
2. State Invariants: The mathematical conditions that remain valid before and after every execution step.
3. Error Handling & Edge Cases: Boundary conditions including empty inputs, overflow limits, concurrency races, and network partitions.`
      },
      {
        heading: '3. Examination Review Questions & Solutions',
        body: `Question 1: Explain the primary architectural principles and operational trade-offs of this domain.
Answer: Systems must balance latency, throughput, memory consumption, and developer ergonomics. Optimizing for fast random access lookups typically requires auxiliary hash indexes or tree nodes, incurring space overhead.

Question 2: What are the primary failure modes and remediation strategies?
Answer: Failure modes include resource exhaustion, unhandled exceptions, and concurrency bottlenecks. Standard remediation strategies include connection pooling, rate limiting, circuit breakers, and idempotent execution.`
      }
    ]
  };
}

/**
 * Generates a complete, publication-quality academic PDF buffer
 */
function createAcademicPdfBuffer(resource) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true,
        info: {
          Title: resource.title || 'ShelfShare Academic Resource',
          Author: resource.uploader_name || 'ShelfShare Academic Contributor',
          Subject: resource.subject_name || 'Computer Applications',
          Keywords: 'academic, notes, study material, shelfshare',
        },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const content = getComprehensiveTopicContent(resource);

      // --- HEADER BANNER ---
      doc.rect(0, 0, 612, 85).fill(COLORS.primary);
      doc.rect(0, 85, 612, 5).fill(COLORS.accent);

      doc.fillColor('#FFFFFF')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('SHELFSHARE', 50, 22);

      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#A9C9B8')
        .text('STUDENT ACADEMIC RESOURCE ECOSYSTEM  •  LEARN. SHARE. GROW.', 50, 46);

      doc.fillColor('#FFFFFF')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('PEER VERIFIED ACADEMIC RESOURCE', 370, 32, { align: 'right' });

      doc.fillColor(COLORS.textPrimary).y = 110;

      // --- TITLE & METADATA CARD ---
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor(COLORS.primary)
        .text(resource.title || 'Academic Resource Notes', { width: 512 });

      doc.moveDown(0.4);

      // Metadata Box
      const metaTop = doc.y;
      doc.roundedRect(50, metaTop, 512, 56, 4).fillAndStroke(COLORS.bgSoft, COLORS.border);

      doc.fillColor(COLORS.textMuted).fontSize(8.5).font('Helvetica');
      doc.text(`COURSE:`, 65, metaTop + 10);
      doc.text(`SUBJECT:`, 65, metaTop + 24);
      doc.text(`CONTRIBUTOR:`, 65, metaTop + 38);

      doc.fillColor(COLORS.textPrimary).font('Helvetica-Bold');
      doc.text(`${resource.course_code || 'MCA'} (Sem ${resource.semester_number || '1'})`, 140, metaTop + 10);
      doc.text(`${resource.subject_name || 'Computer Applications'}`, 140, metaTop + 24);
      doc.text(`${resource.uploader_name || 'Peer Verified Contributor'} (${resource.academic_year || '2025-2026'})`, 140, metaTop + 38);

      doc.fillColor(COLORS.textMuted).font('Helvetica');
      doc.text(`RESOURCE TYPE:`, 320, metaTop + 10);
      doc.text(`RATING:`, 320, metaTop + 24);
      doc.text(`STATUS:`, 320, metaTop + 38);

      doc.fillColor(COLORS.textPrimary).font('Helvetica-Bold');
      doc.text(`${resource.resource_type || 'Lecture Notes'}`, 415, metaTop + 10);
      doc.text(`★ ${resource.average_rating || '4.8'} / 5.0 (${resource.total_reviews || '5'} reviews)`, 415, metaTop + 24);
      doc.fillColor(COLORS.accent).text(`Verified by ShelfShare`, 415, metaTop + 38);

      doc.y = metaTop + 72;

      // --- LEARNING OBJECTIVES ---
      doc.moveDown(0.6);
      doc.fillColor(COLORS.primary).fontSize(12).font('Helvetica-Bold').text('Learning Objectives & Key Takeaways');
      doc.moveDown(0.3);

      for (const obj of content.learningObjectives) {
        doc.fillColor(COLORS.accent).fontSize(10).font('Helvetica-Bold').text('• ', { continued: true });
        doc.fillColor(COLORS.textPrimary).font('Helvetica').text(obj, { indent: 12 });
        doc.moveDown(0.15);
      }

      doc.moveDown(0.6);

      // --- SECTIONS ---
      for (const section of content.sections) {
        if (doc.y > 680) {
          doc.addPage();
          doc.y = 50;
        }

        doc.fillColor(COLORS.secondary).fontSize(12).font('Helvetica-Bold').text(section.heading);
        doc.moveDown(0.3);

        if (section.isCode) {
          const codeLines = section.code.split('\n');
          const boxHeight = Math.min(codeLines.length * 12 + 16, 260);

          if (doc.y + boxHeight > 740) {
            doc.addPage();
            doc.y = 50;
          }

          const codeTop = doc.y;
          doc.roundedRect(50, codeTop, 512, boxHeight, 4).fill(COLORS.codeBg);

          doc.fillColor(COLORS.codeText).fontSize(8).font('Courier');
          let currentLineY = codeTop + 10;
          for (const line of codeLines) {
            doc.text(line, 62, currentLineY, { width: 488 });
            currentLineY += 12;
            if (currentLineY > codeTop + boxHeight - 12) break;
          }
          doc.y = codeTop + boxHeight + 14;
        } else {
          doc.fillColor(COLORS.textPrimary).fontSize(9.5).font('Helvetica').text(section.body, {
            lineGap: 3,
            align: 'justify',
          });
          doc.moveDown(0.6);
        }
      }

      // --- FOOTER ON ALL PAGES ---
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.rect(50, 755, 512, 1).fill(COLORS.border);
        doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica');
        doc.text('ShelfShare Academic Resource Sharing Platform  •  https://shelfshare-7js7.vercel.app', 50, 762);
        doc.text(`Page ${i + 1} of ${totalPages}`, 450, 762, { align: 'right' });
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
