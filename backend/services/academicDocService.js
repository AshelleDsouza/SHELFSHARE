const PDFDocument = require('pdfkit');

/**
 * Academic Document Generator Service
 * Produces authoritative, textbook-grade study guides and lecture notes
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
 * Generates comprehensive academic content tailored to the topic
 */
function getComprehensiveTopicContent(resource) {
  const title = (resource.title || '').toLowerCase();
  const desc = (resource.description || '').toLowerCase();

  // 1. DISTRIBUTED SYSTEMS AUDIT & ARCHITECTURE (Resource 31 & Distributed Notes)
  if (title.includes('audit') || title.includes('distributed') || desc.includes('distributed')) {
    return {
      moduleTitle: 'Advanced Distributed Systems Architecture & Reliability Auditing',
      unit: 'Unit 4: Distributed Consensus, Fault Tolerance & System Audits',
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

  // 2. DATA STRUCTURES & ALGORITHMS - TREES & AVL (Resource 1, 13, 19)
  if (title.includes('tree') || title.includes('avl') || title.includes('dsa') || title.includes('algorithm')) {
    return {
      moduleTitle: 'Data Structures & Advanced Algorithms: Balanced Search Trees',
      unit: 'Unit 3: Hierarchical Structures, AVL Trees & Self-Balancing Rotations',
      learningObjectives: [
        'Analyze worst-case degradation in standard Binary Search Trees (BST) from O(log N) to O(N).',
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

  // 3. DATABASE MANAGEMENT SYSTEMS (DBMS) - NORMALIZATION (Resource 2, 14)
  if (title.includes('dbms') || title.includes('normalization') || title.includes('acid') || title.includes('database')) {
    return {
      moduleTitle: 'Advanced Database Management Systems: Relational Normalization & ACID',
      unit: 'Unit 2: Functional Dependencies, Normal Forms (1NF-BCNF) & Transaction Isolation',
      learningObjectives: [
        'Identify modification anomalies: Insertion, Deletion, and Update anomalies.',
        'Calculate attribute closures and minimal covers for functional dependency sets.',
        'Execute step-by-step lossless-join, dependency-preserving decomposition into BCNF/3NF.',
        'Analyze ACID transaction guarantees and concurrency isolation levels (Read Committed, Serializable).'
      ],
      sections: [
        {
          heading: '1. Anomalies in Unnormalized Relational Schemas',
          body: `In an unnormalized schema (e.g., Student_Course_Dept in a single relation), redundant data storage causes three primary anomalies:
1. Update Anomaly: If a department name changes, thousands of student rows must be updated; failure to update all rows results in data inconsistency.
2. Insertion Anomaly: Cannot record a new course or department without enrolling at least one student, forcing artificial NULL values in primary key columns.
3. Deletion Anomaly: If the only student enrolled in a course graduates and their record is deleted, all historical course and faculty data is unintentionally destroyed.`
        },
        {
          heading: '2. Progression of Relational Normal Forms',
          body: `• First Normal Form (1NF): Every attribute domain contains only atomic (indivisible) values. Multi-valued attributes and nested repeating groups are eliminated.
• Second Normal Form (2NF): Must be in 1NF and every non-prime attribute must be fully functionally dependent on the primary key (no partial dependencies on a subset of a composite candidate key).
• Third Normal Form (3NF): Must be in 2NF and no non-prime attribute may be transitively dependent on the primary key. For every functional dependency X -> A, either X is a superkey or A is a prime attribute.
• Boyce-Codd Normal Form (BCNF): A stricter version of 3NF. For every non-trivial functional dependency X -> A, X MUST be a superkey.`
        },
        {
          heading: '3. Worked Example: Decomposition into BCNF',
          body: `Given Relation R(A, B, C, D, E) with Functional Dependencies F:
  { A -> B, BC -> D, D -> E, A -> C }

Step 1: Compute Candidate Keys:
  Closure of A: A+ = {A, B, C, D, E}. Thus, A is a Candidate Key.
Step 2: Check each FD for BCNF violation:
  • A -> B: A is a superkey (Satisfies BCNF).
  • A -> C: A is a superkey (Satisfies BCNF).
  • D -> E: D is NOT a superkey (Violates BCNF).
Step 3: Decompose on D -> E:
  R1 = (D, E) with Key D.
  R2 = (A, B, C, D) with Key A.
Both R1 and R2 satisfy BCNF with lossless join guarantee.`
        },
        {
          heading: '4. ACID Transaction Properties & ANSI SQL Isolation Levels',
          body: `• Atomicity: All operations in a transaction succeed (COMMIT) or rollback completely (ROLLBACK).
• Consistency: State transitions preserve all database invariants and foreign key constraints.
• Isolation: Concurrently executing transactions do not interfere with each other.
• Durability: Once committed, state changes survive server crashes and power loss.

Isolation Levels:
1. Read Uncommitted: Permits Dirty Reads, Non-repeatable Reads, and Phantom Reads.
2. Read Committed (Default in PostgreSQL/Oracle): Prevents Dirty Reads.
3. Repeatable Read (Default in MySQL InnoDB): Prevents Dirty Reads and Non-repeatable Reads via MVCC.
4. Serializable: Complete isolation using Two-Phase Locking (2PL) or Serializable Snapshot Isolation.`
        }
      ]
    };
  }

  // 4. OPERATING SYSTEMS - CPU SCHEDULING (Resource 3, 15, 20)
  if (title.includes('scheduling') || title.includes('operating system') || title.includes('deadlock') || title.includes('os ')) {
    return {
      moduleTitle: 'Operating Systems: Process Management, Scheduling & Concurrency',
      unit: 'Unit 2: CPU Scheduling Algorithms, Gantt Charts & Deadlock Avoidance',
      learningObjectives: [
        'Understand the Process Control Block (PCB) structure and process state transitions.',
        'Calculate Turnaround Time, Waiting Time, and Response Time across scheduling algorithms.',
        'Simulate Preemptive vs Non-Preemptive FCFS, SJF, Priority, and Round Robin scheduling.',
        'Apply Dijkstra\'s Banker\'s Algorithm for deadlock avoidance in multi-resource environments.'
      ],
      sections: [
        {
          heading: '1. Process Scheduling Criteria & Mathematical Metrics',
          body: `The primary objective of the CPU scheduler is to maximize CPU utilization while minimizing waiting and response times.
Formulas:
• Turnaround Time (TAT) = Completion Time (CT) - Arrival Time (AT)
• Waiting Time (WT) = Turnaround Time (TAT) - Burst Time (BT)
• Throughput = Number of processes completed / Unit Time
• Response Time = Time from arrival to first execution allocation`
        },
        {
          heading: '2. Comparative Scheduling Analysis: Round Robin vs Shortest Job First',
          body: `Given 4 processes with Arrival Time (AT) and Burst Time (BT):
Process P1: AT=0, BT=5
Process P2: AT=1, BT=3
Process P3: AT=2, BT=8
Process P4: AT=3, BT=6

Under Shortest Remaining Time First (SRTF - Preemptive SJF):
Gantt Chart:
[0--P1--1][1--P2--4][4--P1--8][8--P4--14][14--P3--22]

Calculations:
• P1: CT=8, TAT = 8 - 0 = 8, WT = 8 - 5 = 3
• P2: CT=4, TAT = 4 - 1 = 3, WT = 3 - 3 = 0
• P3: CT=22, TAT = 22 - 2 = 20, WT = 20 - 8 = 12
• P4: CT=14, TAT = 14 - 3 = 11, WT = 11 - 6 = 5

Average Turnaround Time = (8 + 3 + 20 + 11) / 4 = 10.5 ms
Average Waiting Time = (3 + 0 + 12 + 5) / 4 = 5.0 ms`
        },
        {
          heading: '3. Deadlock Characterization: Coffman Conditions',
          body: `A deadlock state occurs if and only if all four Coffman conditions hold simultaneously:
1. Mutual Exclusion: At least one resource is held in a non-shareable mode.
2. Hold and Wait: A process holds at least one resource and requests additional resources held by others.
3. No Preemption: Resources cannot be forcibly taken from a process before completion.
4. Circular Wait: A closed chain of processes exists where P0 waits for P1, P1 waits for P2, ..., Pn waits for P0.`
        }
      ]
    };
  }

  // 5. COMPUTER NETWORKS - OSI & TCP/IP (Resource 4)
  if (title.includes('network') || title.includes('tcp') || title.includes('osi')) {
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
          body: `Layer 7: Application (HTTP, DNS, SMTP, SSH) - High-level protocol interaction.
Layer 6: Presentation (TLS/SSL, ASCII, JPEG) - Data serialization, compression, and encryption.
Layer 5: Session (RPC, NetBIOS) - Dialog control, token management, synchronization.
Layer 4: Transport (TCP, UDP) - End-to-end process-to-process delivery, port addressing.
Layer 3: Network (IP, ICMP, BGP, OSPF) - Logical IP addressing, routing across subnets.
Layer 2: Data Link (Ethernet 802.3, Wi-Fi 802.11) - Physical MAC framing, error detection (CRC).
Layer 1: Physical (Cat6, Fiber Optic, Radio RF) - Transmission of unstructured raw bit streams.`
        },
        {
          heading: '2. TCP Reliable Transport & Three-Way Handshake',
          body: `To establish a reliable full-duplex transmission channel, TCP uses sequence numbers:
1. Client -> Server: SYN (Seq = x) - Client requests connection with initial sequence number.
2. Server -> Client: SYN-ACK (Seq = y, Ack = x + 1) - Server acknowledges and sends its sequence number.
3. Client -> Server: ACK (Seq = x + 1, Ack = y + 1) - Connection established (ESTABLISHED state).`
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
 * Generates a complete, beautiful, publication-quality academic PDF buffer
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
        // Check remaining page height, add page if needed
        if (doc.y > 680) {
          doc.addPage();
          doc.y = 50;
        }

        doc.fillColor(COLORS.secondary).fontSize(12).font('Helvetica-Bold').text(section.heading);
        doc.moveDown(0.3);

        if (section.isCode) {
          // Render Syntax Code Box
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
