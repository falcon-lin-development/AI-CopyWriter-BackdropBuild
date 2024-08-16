interface MarkValues {
    mark: string | MarkValues;
    mark2?: string | MarkValues; // default 0
    operation?: "add" | "substract" | "multiply" | "divide"; // if not provided, its equivalent to a single mark value
}

interface ScoreMaker {
    mark: string;
    value_assign?: number;
    value_add?: number;
    weight_multiplier?: number;
}

interface ScoringCondition {
    mark: string;
    value_eq?: string | number | MarkValues;
    value_large_than?: string | number | MarkValues;
}

interface ScoringLogic {
    rules: {
        [qid: string]: {
            condition: ScoringCondition;
            scores: ScoreMaker[];
        }
    }
    global_rules: {
        condition: ScoringCondition;
        scores: ScoreMaker[];
    }[];

}

interface ResultCondition {
    mark: string;
    value_eq?: string | number | MarkValues;
    value_large_than?: string | number | MarkValues;
}

interface ResultLogic {
    single_result: boolean;
    result_rules: {
        all_condition_required: boolean;
        conditions: ResultCondition[];
        result: string;
    }[];
}

interface SurveyScoringDefinition {
    marks: Record<string, number|string>;
    results: string[];
    scoring_logic: ScoringLogic; // all question-answer pair is processed to the marks' <string, number|string> pair at the beginning.
    result_logic: ResultLogic;
}



// function evaluateMarkValue(markScores: { [key: string]: number }, value: string | number | MarkValues): number {
//     if (typeof value === "number") {
//         return value;
//     }
//     if (typeof value === "string") {
//         return markScores[value] || 0;
//     }
//     const mark1Value = evaluateMarkValue(markScores, value.mark);
//     const mark2Value = value.mark2 ? evaluateMarkValue(markScores, value.mark2) : 0;

//     switch (value.operation) {
//         case "add":
//             return mark1Value + mark2Value;
//         case "substract":
//             return mark1Value - mark2Value;
//         case "multiply":
//             return mark1Value * mark2Value;
//         case "divide":
//             return mark1Value / mark2Value;
//         default:
//             return mark1Value;
//     }
// }

// function calculateSurveyResult(survey: SurveyScoringDefinition, answers: { [key: string]: string }): string | undefined {
//     const markScores: { [key: string]: number|string } = survey.marks;
    

//     // Helper function to evaluate a condition
//     function evaluateCondition(markScores: { [key: string]: number }, condition: ScoringCondition, answer: string | number): boolean {
//         const conditionValueEq = condition.value_eq ? evaluateMarkValue(markScores, condition.value_eq) : undefined;
//         const conditionValueLargeThan = condition.value_large_than ? evaluateMarkValue(markScores, condition.value_large_than) : undefined;

//         // Convert answer to number if needed
//         const parsedAnswer = isNaN(Number(answer)) ? answer : Number(answer);

//         // Check for equality condition
//         if (conditionValueEq !== undefined && parsedAnswer === conditionValueEq) {
//             return true;
//         }

//         // Check for greater than condition
//         if (conditionValueLargeThan !== undefined && Number(parsedAnswer) > conditionValueLargeThan) {
//             return true;
//         }

//         return false;
//     }

//     // Apply question-based rules
//     for (const questionId in survey.scoring_logic.rules) {
//         const rule = survey.scoring_logic.rules[questionId];
//         const userAnswer = answers[questionId];

//         // Apply the rule if the condition passes
//         if (evaluateCondition(markScores, rule.condition, userAnswer)) {
//             rule.scores.forEach(scoreRule => {
//                 if (scoreRule.value_add) {
//                     markScores[scoreRule.mark] += scoreRule.value_add;
//                 }
//                 if (scoreRule.value_assign !== undefined) {
//                     markScores[scoreRule.mark] = scoreRule.value_assign;
//                 }
//                 if (scoreRule.weight_multiplier) {
//                     markScores[scoreRule.mark] *= scoreRule.weight_multiplier;
//                 }
//             });
//         }
//     }

//     // Apply global rules at the end
//     survey.scoring_logic.global_rules.forEach(globalRule => {
//         // Global rules apply to all marks and should be evaluated without user-specific question answers
//         if (evaluateCondition(markScores, globalRule.condition, markScores[globalRule.condition.mark])) {
//             globalRule.scores.forEach(scoreRule => {
//                 if (scoreRule.value_add) {
//                     markScores[scoreRule.mark] += scoreRule.value_add;
//                 }
//                 if (scoreRule.value_assign !== undefined) {
//                     markScores[scoreRule.mark] = scoreRule.value_assign;
//                 }
//                 if (scoreRule.weight_multiplier) {
//                     markScores[scoreRule.mark] *= scoreRule.weight_multiplier;
//                 }
//             });
//         }
//     });

//     // Apply result logic
//     for (const rule of survey.result_logic.result_rules) {
//         let rulePassed = true;

//         for (const condition of rule.conditions) {
//             const markScore = markScores[condition.mark];
//             const conditionValueEq = condition.value_eq ? evaluateMarkValue(markScores, condition.value_eq) : undefined;
//             const conditionValueLargeThan = condition.value_large_than ? evaluateMarkValue(markScores, condition.value_large_than) : undefined;

//             // Check equality conditions
//             if (conditionValueEq !== undefined && markScore !== conditionValueEq) {
//                 rulePassed = false;
//                 break;
//             }

//             // Check larger-than conditions
//             if (conditionValueLargeThan !== undefined && markScore <= conditionValueLargeThan) {
//                 rulePassed = false;
//                 break;
//             }
//         }

//         if (rulePassed) {
//             return rule.result;
//         }
//     }

//     return undefined;
// }
