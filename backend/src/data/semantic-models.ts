/**
 * Semantic Models - 33 SQL patterns for the Finance Agent
 * These patterns cover all common query types and serve as examples for the LLM
 */

export interface SemanticModel {
  id: string;
  name: string;
  description: string;
  sql: string;
  tables: string[];
  operations: string[];
  use_cases: string[];
  text: string; // For embeddings
}

export const SEMANTIC_MODELS: SemanticModel[] = [
  // ACTUAL SCHEMA MODELS FOR CUSTOMERS, CONVERSATIONS, ANALYSIS
  
  {
    id: "model_customer_count",
    name: "Count Customers",
    description: "Count total customers in the database",
    sql: `SELECT COUNT(*) AS total_customers FROM customers LIMIT 1`,
    tables: ["customers"],
    operations: ["COUNT"],
    use_cases: ["customer_analytics", "summary"],
    text: "Count the total number of customers in the database",
  },
  {
    id: "model_customers_by_industry",
    name: "Customers by Industry",
    description: "Group customers by their industry sector",
    sql: `SELECT industry, COUNT(*) as customer_count FROM customers WHERE industry IS NOT NULL GROUP BY industry ORDER BY customer_count DESC`,
    tables: ["customers"],
    operations: ["GROUP BY", "COUNT", "WHERE"],
    use_cases: ["customer_segmentation", "industry_analysis"],
    text: "Analyze customer distribution across different industry sectors",
  },
  {
    id: "model_customer_details",
    name: "Customer Details with Location",
    description: "Get customer information with their location and contact details",
    sql: `SELECT id, company_name, industry, location, email, phone_number, created_at FROM customers ORDER BY created_at DESC LIMIT 100`,
    tables: ["customers"],
    operations: ["SELECT", "ORDER BY", "LIMIT"],
    use_cases: ["customer_lookup", "contact_list"],
    text: "Retrieve customer details including company name, industry, location and contact information",
  },
  {
    id: "model_customer_conversations",
    name: "Customer Conversations",
    description: "Join customers with their conversations to see interaction history",
    sql: `SELECT c.company_name, c.industry, conv.id, conv.call_id, conv.transcript, conv.created_at FROM customers c LEFT JOIN conversations conv ON c.id = conv.customer_id ORDER BY conv.created_at DESC LIMIT 100`,
    tables: ["customers", "conversations"],
    operations: ["LEFT JOIN", "ORDER BY", "LIMIT"],
    use_cases: ["conversation_history", "customer_interactions"],
    text: "Get customers with their conversation transcripts and call history",
  },
  {
    id: "model_conversation_count_by_customer",
    name: "Conversation Count per Customer",
    description: "Count conversations for each customer",
    sql: `SELECT c.id, c.company_name, COUNT(conv.id) as conversation_count FROM customers c LEFT JOIN conversations conv ON c.id = conv.customer_id GROUP BY c.id, c.company_name ORDER BY conversation_count DESC`,
    tables: ["customers", "conversations"],
    operations: ["LEFT JOIN", "GROUP BY", "COUNT"],
    use_cases: ["customer_engagement", "activity_ranking"],
    text: "Analyze customer engagement by counting total conversations per customer",
  },
  {
    id: "model_recent_conversations",
    name: "Recent Conversations",
    description: "Get the most recent conversations with customer details",
    sql: `SELECT c.company_name, conv.call_id, conv.created_at, SUBSTRING(conv.transcript, 1, 100) as transcript_preview FROM conversations conv JOIN customers c ON conv.customer_id = c.id ORDER BY conv.created_at DESC LIMIT 20`,
    tables: ["conversations", "customers"],
    operations: ["JOIN", "ORDER BY", "LIMIT", "SUBSTRING"],
    use_cases: ["recent_activity", "conversation_review"],
    text: "Get the most recent customer conversations with preview of transcript",
  },
  {
    id: "model_analysis_scores_by_customer",
    name: "Analysis Evaluation Scores by Customer",
    description: "Join customers with analysis results and evaluation scores",
    sql: `SELECT c.company_name, c.industry, AVG(e.accuracy) as avg_accuracy, AVG(e.faithfulness) as avg_faithfulness, AVG(e.overall_score) as avg_score FROM customers c LEFT JOIN conversations conv ON c.id = conv.customer_id LEFT JOIN embeddings emb ON conv.call_id = emb.call_id LEFT JOIN analysis_results ar ON ar.id = ar.id LEFT JOIN evaluations e ON e.analysis_id = ar.id WHERE e.overall_score IS NOT NULL GROUP BY c.id, c.company_name, c.industry ORDER BY avg_score DESC`,
    tables: ["customers", "conversations", "analysis_results", "evaluations"],
    operations: ["LEFT JOIN", "GROUP BY", "AVG", "WHERE"],
    use_cases: ["quality_metrics", "performance_analysis"],
    text: "Calculate average evaluation scores (accuracy, faithfulness) for each customer's analyses",
  },
  {
    id: "model_top_customers_by_conversations",
    name: "Top Customers by Conversation Volume",
    description: "Rank customers by their conversation frequency",
    sql: `SELECT c.id, c.company_name, c.industry, COUNT(conv.id) as total_conversations FROM customers c LEFT JOIN conversations conv ON c.id = conv.customer_id GROUP BY c.id, c.company_name, c.industry HAVING COUNT(conv.id) > 0 ORDER BY total_conversations DESC LIMIT 10`,
    tables: ["customers", "conversations"],
    operations: ["LEFT JOIN", "GROUP BY", "HAVING", "COUNT", "ORDER BY", "LIMIT"],
    use_cases: ["customer_ranking", "engagement_metrics"],
    text: "Identify top customers with the most conversations and interactions",
  },
  {
    id: "model_conversation_timeline",
    name: "Customer Conversation Timeline",
    description: "Show conversation activity over time for a customer",
    sql: `SELECT DATE(conv.created_at) as conversation_date, COUNT(*) as daily_conversations FROM conversations conv GROUP BY DATE(conv.created_at) ORDER BY conversation_date DESC LIMIT 30`,
    tables: ["conversations"],
    operations: ["GROUP BY", "DATE", "COUNT", "ORDER BY"],
    use_cases: ["timeline_analysis", "activity_trends"],
    text: "Analyze conversation volume trends by date over the last month",
  },
  {
    id: "model_evaluation_quality_report",
    name: "Overall Evaluation Quality Report",
    description: "Get quality metrics from all evaluations",
    sql: `SELECT AVG(accuracy) as avg_accuracy, AVG(faithfulness) as avg_faithfulness, AVG(reasoning_quality) as avg_reasoning, AVG(overall_score) as avg_overall, COUNT(*) as total_evaluations FROM evaluations`,
    tables: ["evaluations"],
    operations: ["AVG", "COUNT"],
    use_cases: ["quality_dashboard", "system_metrics"],
    text: "Calculate system-wide quality metrics from all evaluation results",
  },
];

export function getSemanticModelById(id: string): SemanticModel | undefined {
  return SEMANTIC_MODELS.find((model) => model.id === id);
}

export function getAllSemanticModels(): SemanticModel[] {
  return SEMANTIC_MODELS;
}

export function getModelsByUseCase(useCase: string): SemanticModel[] {
  return SEMANTIC_MODELS.filter((model) => model.use_cases.includes(useCase));
}
