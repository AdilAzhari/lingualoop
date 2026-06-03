<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class GlossaryController extends Controller
{
    private const ENTRIES = [
        [
            'code' => 'preposition_choice',
            'display_name' => 'Preposition choice',
            'dimension' => 'grammar',
            'explanation' => 'English prepositions are largely idiomatic — "at the airport", "in the city", "on the bus". The rule of thumb: at = point, in = enclosed space, on = surface. But idioms override rules ("on the phone", "at university").',
            'wrong' => 'She arrived in the airport just before midnight.',
            'right' => 'She arrived at the airport just before midnight.',
            'tip' => 'Learn prepositions as chunks: "arrive at", "good at", "interested in", "responsible for". Do not try to derive them from rules alone.',
        ],
        [
            'code' => 'article_omission',
            'display_name' => 'Article omission',
            'dimension' => 'grammar',
            'explanation' => 'English has two articles: "a/an" (indefinite — first mention or general) and "the" (definite — already known, unique, or just mentioned). Many learners omit "the" before nouns that feel obvious.',
            'wrong' => 'Government should invest in education.',
            'right' => 'The government should invest in education.',
            'tip' => 'If you are talking about a specific, known entity ("the government we just mentioned"), use "the". Generic statements about abstract nouns often need no article: "Education matters."',
        ],
        [
            'code' => 'subject_verb_agreement',
            'display_name' => 'Subject-verb agreement',
            'dimension' => 'grammar',
            'explanation' => 'The verb must agree with its subject in number. Collective nouns (team, committee, government) take singular verbs in American English and can take plural in British English.',
            'wrong' => 'The number of students who fail are increasing.',
            'right' => 'The number of students who fail is increasing.',
            'tip' => 'Find the true subject — ignore phrases between the subject and verb. "The number of X" is singular. "A number of X" is plural.',
        ],
        [
            'code' => 'comma_splice',
            'display_name' => 'Comma splice',
            'dimension' => 'grammar',
            'explanation' => 'A comma splice joins two independent clauses with only a comma. Use a semicolon, a full stop, or a coordinating conjunction (and, but, so, yet) instead.',
            'wrong' => 'Travel broadens the mind, it also creates anxiety.',
            'right' => 'Travel broadens the mind; it also creates anxiety.',
            'tip' => 'If both parts could stand alone as sentences, a comma alone is not enough. Add "but", "and", "so" — or use a semicolon.',
        ],
        [
            'code' => 'verb_tense_shift',
            'display_name' => 'Verb tense shift',
            'dimension' => 'grammar',
            'explanation' => 'Inconsistent tense shifts confuse the reader about when events happen. Choose a primary tense for your narrative and stick to it unless you have a reason to shift.',
            'wrong' => 'I walked into the room and see everyone looking at me.',
            'right' => 'I walked into the room and saw everyone looking at me.',
            'tip' => 'In essays, use past tense for narratives and present tense for general truths. Do not mix them without purpose.',
        ],
        [
            'code' => 'register_mismatch',
            'display_name' => 'Register slip',
            'dimension' => 'vocabulary',
            'explanation' => 'Register is the level of formality. Academic writing requires formal register — avoid contractions, slang, and conversational phrases.',
            'wrong' => 'Lots of people think climate change is a big deal.',
            'right' => 'A significant proportion of people believe climate change is a critical issue.',
            'tip' => 'Replace: "lots of" → "a significant number of", "big" → "substantial", "kids" → "children", "get" → "obtain/receive".',
        ],
        [
            'code' => 'word_form',
            'display_name' => 'Word form',
            'dimension' => 'vocabulary',
            'explanation' => 'Using the wrong grammatical form of a word — noun where an adjective is needed, verb where a noun is needed, etc.',
            'wrong' => 'The decision was make by the committee.',
            'right' => 'The decision was made by the committee.',
            'tip' => 'Check whether you need a noun (-tion, -ness, -ity), adjective (-al, -ive, -ful), verb, or adverb (-ly). "Economic" vs "economical" vs "economy" vs "economically" are all different.',
        ],
        [
            'code' => 'collocation_unusual',
            'display_name' => 'Collocation unusual',
            'dimension' => 'vocabulary',
            'explanation' => 'Words that are individually correct but do not naturally go together in English. Collocations are fixed partnerships: "make a decision" (not "do a decision"), "heavy rain" (not "strong rain").',
            'wrong' => 'She did a great effort to finish on time.',
            'right' => 'She made a great effort to finish on time.',
            'tip' => 'Learn collocations as complete phrases. Common verbs: make (a decision, an effort, a mistake), do (research, homework, damage), take (action, responsibility, a risk).',
        ],
        [
            'code' => 'cohesion_weak',
            'display_name' => 'Cohesion weak',
            'dimension' => 'coherence',
            'explanation' => 'Cohesion is the way sentences connect to each other. Weak cohesion means the reader has to work to see the link between ideas. Use connectives, pronoun reference, and lexical repetition deliberately.',
            'wrong' => 'The city is polluted. Many people drive cars. Public transport is expensive.',
            'right' => 'The city is heavily polluted, largely because many people drive private cars. This is partly explained by the high cost of public transport.',
            'tip' => 'Every sentence should clearly relate to the previous one. Use "This/These/Such" to refer back. Use linkers: "as a result", "in contrast", "furthermore".',
        ],
        [
            'code' => 'paragraph_unfocused',
            'display_name' => 'Paragraph unfocused',
            'dimension' => 'coherence',
            'explanation' => 'Each paragraph should have one clear controlling idea, stated in the topic sentence. An unfocused paragraph drifts across several ideas without fully developing any.',
            'wrong' => 'Tourism has many benefits. It creates jobs. Culture is also important. Local food is popular.',
            'right' => 'Tourism generates significant economic benefits for local communities, most directly through employment in hospitality, transport, and retail.',
            'tip' => 'Write your topic sentence first, then ask: does every sentence in this paragraph support exactly this point? Cut or move anything that does not.',
        ],
        [
            'code' => 'off_topic_drift',
            'display_name' => 'Off-topic drift',
            'dimension' => 'task',
            'explanation' => 'The essay moves away from the specific question asked. IELTS and academic tasks penalise answers that are partially off-topic even if they are well-written.',
            'wrong' => 'The prompt asks about remote work. The essay discusses technology in general.',
            'right' => 'Every paragraph addresses specifically how remote work affects productivity, wellbeing, or team dynamics.',
            'tip' => 'Re-read the prompt after every paragraph. Ask: "Is this directly answering the question?" If not, cut or redirect.',
        ],
        [
            'code' => 'prompt_partial',
            'display_name' => 'Prompt partial',
            'dimension' => 'task',
            'explanation' => 'The prompt has multiple parts (e.g., "discuss advantages AND disadvantages") but the essay only addresses one. Partial answers lose significant task-response marks.',
            'wrong' => 'The essay only discusses advantages and ignores the "to what extent do you agree" part.',
            'right' => 'Both advantages and disadvantages are addressed, followed by a clear position statement.',
            'tip' => 'Underline every instruction word in the prompt: "discuss", "evaluate", "to what extent", "give your opinion". Address each one explicitly.',
        ],
    ];

    public function __invoke(): Response
    {
        return Inertia::render('Glossary', ['entries' => self::ENTRIES]);
    }

    /** GET /glossary/json — machine-readable for the MarginNote "Why?" widget */
    public function json(): JsonResponse
    {
        return response()->json(
            collect(self::ENTRIES)->keyBy('code')->map(fn ($e) => [
                'explanation' => $e['explanation'],
                'wrong'       => $e['wrong'],
                'right'       => $e['right'],
                'tip'         => $e['tip'],
            ])
        );
    }
}
