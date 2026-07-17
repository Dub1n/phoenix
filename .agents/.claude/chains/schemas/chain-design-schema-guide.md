---
date-created: 2025-09-12-0900
---

# Chain Analyst Universal Schema Usage Guide

## Purpose and Context

This schema serves as the standardized format for all Chain Engineers to present their designs to Chain Analysts for synthesis and optimization. Each Chain Engineer (v1.0 through v1.4) should populate this schema **after** completing their chain design, not before.

**Key Principle**: Don't fabricate information outside your expertise area. Use optional sections appropriately and focus on accurately representing your design approach and its strengths.

## Schema Population Strategy by Engineer Type

### For All Engineers - Required Sections

#### 1. Chain Specification (REQUIRED)

**Purpose**: Provides the concrete executable chain design that can be implemented.

- **Chain Structure**: Focus on agent count, execution pattern, and phase breakdown
- **Execution Flow**: Include specific Task() invocations with timeouts and success criteria  
- **Resource Requirements**: Estimate duration, peak agents, computational needs

**Guidelines**:

- Be as specific as possible about Task() specifications
- Include actual timeout values you would use
- Provide concrete success criteria, not abstract goals
- Map dependencies clearly between tasks

#### 2. Engineering Profile (REQUIRED)

**Purpose**: Identifies your approach philosophy for synthesis comparison.

- **Engineer Version**: Select your version (v1.0-practical, v1.1-algorithmic, etc.)
- **Primary Optimization Focus**: What did you primarily optimize for?
- **Core Strengths**: What does your design do particularly well?
- **Acknowledged Limitations**: Be honest about trade-offs and constraints

**Guidelines**:

- Be clear about your optimization priorities
- Acknowledge limitations honestly - this helps synthesis
- Describe your approach in terms that other engineers would understand

#### 3. Performance Expectations (REQUIRED)

**Purpose**: Sets clear expectations for chain outcomes and success measurement.

- **Success Probability**: Your honest estimate (0.0 to 1.0)
- **Success Criteria**: Concrete, measurable criteria
- **Trade-off Decisions**: Document conscious choices you made

**Guidelines**:

- Provide realistic probability estimates, not optimistic ones
- Include both functional and non-functional success criteria
- Explain trade-offs clearly (what you sacrificed for what benefit)

#### 4. Synthesis Metadata (REQUIRED)

**Purpose**: Enables effective comparison and combination with other designs.

- **Synthesis Readiness**: How complete and ready for integration is your design?
- **Combination Potential**: Which other approaches could work well with yours?
- **Differentiation Factors**: What makes your approach unique?

**Guidelines**:

- Be realistic about completeness level
- Suggest compatible approaches based on complementary strengths
- Highlight what you bring that others might not

### Engineer-Specific Optional Sections

#### Chain Engineer v1.0 (Practical Execution Focus)

**Use Specialization Details > Practical Execution Focus**

Focus on:

- Proven template usage and effectiveness
- Execution reliability measures you've implemented
- Operational efficiency approaches
- Template development insights from this design

**Fill out Optimization Strategy** with:

- Pattern/template usage details
- Practical optimizations applied
- Reliability-focused improvements

#### Chain Engineer v1.1 (Algorithmic Optimization)

**Use Specialization Details > Algorithmic Intelligence**

Focus on:

- Complexity scoring and computational analysis
- Optimization algorithms you applied
- Coordination intelligence and efficiency measures
- Prediction accuracy estimates

**Fill out Optimization Strategy** with:

- Algorithmic optimizations with specific metrics
- Performance calculation methods
- Resource efficiency algorithms

#### Chain Engineer v1.2 (Pattern-Centric Learning)

**Use Specialization Details > Pattern Analytics**

Focus on:

- Pattern selection methodology and confidence scoring
- Historical pattern performance data
- Learning outcomes expected from this execution
- Pattern adaptation strategies

**Fill out Optimization Strategy** with:

- Pattern/template usage with confidence scores
- Pattern-based optimizations
- Historical effectiveness data

#### Chain Engineer v1.3 (Risk-Adaptive Planning)

**Use Risk and Adaptation section extensively + Specialization Details > Probabilistic Modeling**

Focus on:

- Comprehensive risk assessment with mitigation strategies
- Adaptation mechanisms and fallback strategies
- Probabilistic outcome modeling
- Uncertainty handling approaches

**This is your strength area** - populate Risk and Adaptation fully with:

- Detailed risk factors and probabilities
- Multi-layer fallback architectures
- Adaptation triggers and responses

#### Chain Engineer v1.4 (Speed-Optimized Delivery)

**Use Specialization Details > Velocity Metrics**

Focus on:

- Design time optimization and rapid decision approaches
- Execution speed targets and velocity metrics
- Heuristic decision points used
- "Good enough" thresholds applied

**Fill out Optimization Strategy** with:

- Speed optimizations and time savings
- Heuristic-based improvements
- Trade-offs made for velocity

## Section-by-Section Population Guide

### Chain Specification

```json
{
  "chain_structure": {
    "total_agents": 4,  // Actual count, not range
    "execution_pattern": "hybrid",  // Be specific
    "coordination_approach": "file handoff with parallel validation batches",
    "phase_breakdown": [
      {
        "phase_name": "Analysis",
        "agent_count": 1,
        "estimated_duration_minutes": 15,
        "dependencies": [],
        "critical_path": true
      }
    ]
  },
  "execution_flow": {
    "task_specifications": [
      {
        "task_id": "analysis-001",
        "agent_type": "Analysis Agent", 
        "task_description": "Complete system analysis with optimization opportunities identification",
        "timeout_seconds": 900,
        "success_criteria": ["Analysis report generated", "Optimization opportunities identified"],
        "handoff_requirements": ["analysis-report.json", "optimization-targets.json"]
      }
    ]
  }
}
```

### Performance Expectations

```json
{
  "success_probability": 0.87,  // Be realistic, not optimistic
  "primary_success_criteria": [
    "All deliverables meet quality requirements",
    "Execution completes within 45 minutes",
    "No critical errors encountered"
  ],
  "trade_off_decisions": [
    {
      "trade_off_description": "Chose parallel validation over sequential for speed",
      "chosen_approach": "Parallel validation with 3 concurrent agents", 
      "rejected_alternative": "Sequential validation with single agent",
      "rationale": "Reduces total time by 20 minutes with minimal quality impact"
    }
  ]
}
```

### Synthesis Metadata Examples

```json
{
  "synthesis_readiness": {
    "completeness_level": "complete",  // Honest assessment
    "integration_compatibility": "high",  // How flexible is your design?
    "execution_readiness": "immediate"  // Could this run right now?
  },
  "combination_potential": {
    "compatible_approaches": [
      "v1.3-risk-adaptive for fallback enhancement",
      "v1.1-algorithmic for resource optimization"
    ],
    "incompatible_approaches": [
      "v1.4-speed-optimized due to conflicting quality requirements"
    ],
    "integration_opportunities": [
      {
        "integration_area": "Error handling",
        "potential_benefit": "Enhanced recovery strategies from v1.3 risk-adaptive approach",
        "integration_complexity": "medium"
      }
    ]
  }
}
```

## Quality Guidelines

### Do Include

- Specific, actionable details about your chain design
- Honest assessments of probability and confidence
- Clear rationale for design decisions
- Concrete specifications (timeouts, agent counts, criteria)
- Realistic trade-off acknowledgments

### Don't Include  

- Fabricated data outside your expertise (leave sections empty instead)
- Overly optimistic probability estimates
- Vague or abstract descriptions
- Information you're not confident about
- Generic template responses

### Validation Checklist

Before submitting your populated schema:

- [ ] Chain specification is executable (could be implemented immediately)
- [ ] All required fields are populated with realistic values
- [ ] Success probability reflects honest assessment of your design
- [ ] Trade-offs and limitations are acknowledged
- [ ] Specialization sections match your engineer type
- [ ] Synthesis metadata provides actionable information for combination
- [ ] No fabricated information in areas outside your expertise

## Integration with Chain Analyst

The Chain Analyst will use your populated schema to:

1. **Compare Approaches**: Evaluate different design philosophies and trade-offs
2. **Identify Synergies**: Find complementary elements between designs
3. **Resolve Conflicts**: Address incompatibilities between approaches  
4. **Optimize Synthesis**: Combine the best elements from multiple proposals
5. **Validate Integration**: Ensure synthesized design maintains coherence

Your accurate, honest population of this schema directly enables better synthesis outcomes and more effective hybrid chain designs.

## Common Mistakes to Avoid

1. **Over-specification**: Don't include details you're not confident about
2. **Under-specification**: Don't leave required fields empty or vague
3. **Expertise Inflation**: Don't populate specialization sections outside your area
4. **Optimistic Bias**: Don't inflate success probabilities or minimize risks
5. **Generic Responses**: Don't use template language - be specific to your design
6. **Integration Assumptions**: Don't assume how other engineers will approach synthesis

Remember: The goal is accurate representation of your approach to enable optimal synthesis, not to make your design appear perfect or comprehensive beyond your engineering variant's focus areas.
