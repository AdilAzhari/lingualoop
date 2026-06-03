<?php

namespace Database\Seeders;

use App\Models\ErrorType;
use App\Models\ListeningPassage;
use App\Models\ListeningQuestion;
use App\Models\Prompt;
use App\Models\ReadingPassage;
use App\Models\ReadingQuestion;
use App\Models\SpeakingPrompt;
use App\Models\Streak;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedErrorTypes();
        $this->seedPrompts();
        $this->seedReadingPassages();
        $this->seedSpeakingPrompts();
        $this->seedListeningPassages();
        $this->seedDemoUser();
        $this->call(ImagePromptSeeder::class);
    }

    private function seedErrorTypes(): void
    {
        $types = [
            ['preposition_choice', 'Preposition choice', 'grammar'],
            ['article_omission', 'Article omission', 'grammar'],
            ['subject_verb_agreement', 'Subject-verb agreement', 'grammar'],
            ['comma_splice', 'Comma splice', 'grammar'],
            ['verb_tense_shift', 'Verb tense shift', 'grammar'],
            ['register_mismatch', 'Register slip', 'vocabulary'],
            ['word_form', 'Word form', 'vocabulary'],
            ['collocation_unusual', 'Collocation unusual', 'vocabulary'],
            ['cohesion_weak', 'Cohesion weak', 'coherence'],
            ['paragraph_unfocused', 'Paragraph unfocused', 'coherence'],
            ['off_topic_drift', 'Off-topic drift', 'task'],
            ['prompt_partial', 'Prompt partial', 'task'],
        ];

        foreach ($types as [$code, $displayName, $dimension]) {
            ErrorType::firstOrCreate(
                ['code' => $code, 'taxonomy_version' => 'v3.2'],
                ['display_name' => $displayName, 'dimension' => $dimension]
            );
        }
    }

    private function seedPrompts(): void
    {
        $prompts = [
            // ── B2 — Travel & Place ──
            ['level' => 'b2', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'preposition_choice',
                'text' => 'Some people believe travel broadens the mind. Others find it leaves you more rooted. Which has been true for you?'],
            ['level' => 'b2', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'preposition_choice',
                'text' => 'Argue for or against banning short-haul flights in the name of reducing carbon emissions.'],
            ['level' => 'b2', 'task_type' => 'task-1', 'duration_minutes' => 20, 'focus_category' => 'article_omission',
                'text' => 'Describe a childhood place you still dream about. What made it feel the way it did?'],
            ['level' => 'b2', 'task_type' => 'task-1', 'duration_minutes' => 20, 'focus_category' => 'verb_tense_shift',
                'text' => "Write about a time when a stranger's small act of kindness changed your day."],
            ['level' => 'b2', 'task_type' => 'task-1', 'duration_minutes' => 20, 'focus_category' => 'article_omission',
                'text' => 'Describe a place in the natural world — a forest, coastline, desert, or mountain range — that you find compelling. Why does it matter to preserve it?'],

            // ── B2 — Technology ──
            ['level' => 'b2', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'cohesion_weak',
                'text' => 'Some cities are replacing car lanes with cycling infrastructure. Is this good policy?'],
            ['level' => 'b2', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'register_mismatch',
                'text' => 'Social media platforms have transformed communication, but not necessarily for the better. Discuss the advantages and disadvantages of social media in modern life.'],
            ['level' => 'b2', 'task_type' => 'task-1', 'duration_minutes' => 20, 'focus_category' => 'word_form',
                'text' => 'Describe a piece of technology that has significantly changed how you live or work. What would life be like without it?'],
            ['level' => 'b2', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'paragraph_unfocused',
                'text' => 'Children are growing up in an increasingly digital and screen-driven environment. What are the potential benefits and risks for their cognitive and social development?'],

            // ── B2 — Work & Society ──
            ['level' => 'b2', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'cohesion_weak',
                'text' => 'Remote working has become increasingly common since the global pandemic. Discuss the advantages and disadvantages for both employees and employers.'],
            ['level' => 'b2', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'comma_splice',
                'text' => 'Higher education should be free and accessible to all citizens regardless of their financial background. Do you agree or disagree?'],
            ['level' => 'b2', 'task_type' => 'task-1', 'duration_minutes' => 20, 'focus_category' => 'verb_tense_shift',
                'text' => 'Describe a time when you had to work with someone whose approach or personality was very different from your own. What did you learn?'],
            ['level' => 'b2', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'word_form',
                'text' => 'Describe a habit or routine that has had a measurable positive effect on your physical or mental health.'],

            // ── B2 — Environment ──
            ['level' => 'b2', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'preposition_choice',
                'text' => 'Many governments are now investing heavily in renewable energy sources. Evaluate the effectiveness of this approach to addressing climate change.'],
            ['level' => 'b2', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'cohesion_weak',
                'text' => 'Some people argue that the benefits of artificial intelligence far outweigh the risks it poses to employment and privacy. To what extent do you agree or disagree?'],
            ['level' => 'b2', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'off_topic_drift',
                'text' => 'Cities around the world are experiencing rapid population growth and overcrowding. Discuss the causes of this trend and propose solutions to manage it sustainably.'],

            // ── C1 — Philosophy & Ethics ──
            ['level' => 'c1', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'cohesion_weak',
                'text' => 'The concept of meritocracy — the belief that success reflects individual talent and effort — has become a pernicious myth that perpetuates inequality. To what extent do you agree?'],
            ['level' => 'c1', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'register_mismatch',
                'text' => 'The decline of organised religion in many Western societies has produced a crisis of meaning rather than the liberation its critics anticipated. Discuss.'],
            ['level' => 'c1', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'off_topic_drift',
                'text' => 'Individuals are ultimately more responsible for addressing climate change than governments or corporations. To what extent do you agree?'],
            ['level' => 'c1', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'cohesion_weak',
                'text' => 'Excessive exposure to information — rather than a lack of it — is now the primary obstacle to informed democratic participation. Discuss.'],

            // ── C1 — Society & Economics ──
            ['level' => 'c1', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'cohesion_weak',
                'text' => 'Globalisation has brought economic growth to many regions but has simultaneously eroded cultural distinctiveness and entrenched inequality. Discuss with reference to specific examples.'],
            ['level' => 'c1', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'preposition_choice',
                'text' => 'Economic growth and environmental sustainability are fundamentally incompatible objectives. To what extent do you agree?'],
            ['level' => 'c1', 'task_type' => 'task-2', 'duration_minutes' => 20, 'focus_category' => 'register_mismatch',
                'text' => 'Governments should do more to regulate the food industry in order to tackle the global obesity crisis. To what extent do you agree?'],
            ['level' => 'c1', 'task_type' => 'task-1', 'duration_minutes' => 20, 'focus_category' => 'word_form',
                'text' => 'Reflect on a moment when you encountered an idea — in a book, a conversation, or an event — that fundamentally altered how you understand the world. What changed, and why?'],
        ];

        foreach ($prompts as $p) {
            Prompt::updateOrCreate(['text' => $p['text']], $p);
        }
    }

    private function seedReadingPassages(): void
    {
        $passages = [
            // ── B2 ──
            [
                'title' => 'The Science of Sleep', 'topic' => 'Psychology', 'level' => 'b2', 'word_count' => 262,
                'body'  => "For much of human history, sleep was considered a passive state — a nightly interruption to the business of living. Recent decades of neuroscience, however, have revealed it to be an extraordinarily active process, essential for nearly every aspect of mental and physical health.\n\nDuring sleep, the brain cycles through distinct stages. The deepest stage, slow-wave sleep, is when the body repairs tissue, strengthens the immune system, and consolidates memories from the day. A separate phase, rapid eye movement (REM) sleep, is associated with vivid dreaming and plays a critical role in emotional regulation and creative thinking. Adults typically need seven to nine hours per night to complete the full sequence of these cycles.\n\nChronic sleep deprivation carries serious consequences. Studies consistently link insufficient sleep to increased risk of cardiovascular disease, type 2 diabetes, and obesity. Cognitively, even a single night of poor sleep reduces attention, impairs decision-making, and slows reaction times to a degree comparable to alcohol intoxication.\n\nDespite this, many people treat sleep as expendable, routinely sacrificing it to work, social obligations, or screen time. The rise of artificial light and mobile devices has disrupted the body's natural circadian rhythm — the roughly 24-hour internal clock that governs alertness and drowsiness — making it harder to fall and stay asleep.\n\nResearchers now argue that sleep should be treated as a public health priority. Some advocate for later school start times, workplace nap policies, and restrictions on blue-light emissions from screens in the evening. The science is unambiguous: sleep is not a luxury; it is a biological necessity.",
                'questions' => [
                    [1, 'What three things does slow-wave sleep help the body do, according to the passage?', 'Repair tissue, strengthen the immune system, and consolidate memories from the day.'],
                    [2, 'What two functions does REM sleep serve?', 'Emotional regulation and creative thinking.'],
                    [3, 'How does the passage describe the cognitive effect of a single night of poor sleep?', 'It is comparable to alcohol intoxication — reducing attention, impairing decision-making, and slowing reaction times.'],
                    [4, 'What has disrupted the body\'s natural circadian rhythm?', 'The rise of artificial light and mobile devices.'],
                    [5, 'Name one policy change researchers advocate for in the final paragraph.', 'Later school start times, workplace nap policies, or restrictions on blue-light emissions (any one).'],
                ],
            ],
            [
                'title' => 'The Value of Urban Green Spaces', 'topic' => 'Environment', 'level' => 'b2', 'word_count' => 258,
                'body'  => "As cities expand and populations grow, the competition for land intensifies. Parks, gardens, and other green spaces are often the first casualties of urban development — viewed by planners as a luxury rather than a necessity. But a growing body of research suggests this attitude is misguided and potentially costly.\n\nThe mental health benefits of access to nature are well-documented. Studies show that people who live within walking distance of a park report lower levels of anxiety and depression than those who do not. Even brief exposure to trees and grass — a ten-minute walk through a park — measurably reduces cortisol, the body's primary stress hormone. For city dwellers, who face constant stimulation from noise, advertising, and crowds, these restorative effects are particularly significant.\n\nGreen spaces also provide critical environmental services. Urban trees absorb carbon dioxide, filter air pollutants, and reduce the so-called urban heat island effect — the phenomenon whereby built environments trap heat and become significantly warmer than surrounding rural areas. In cities with dense tree cover, summer temperatures can be several degrees lower than in treeless districts.\n\nFurthermore, green spaces serve as social infrastructure. Community gardens and public parks create neutral ground where people from different backgrounds can interact, reducing social isolation and strengthening community cohesion.\n\nDespite these benefits, funding for urban parks has fallen in many cities. Advocates argue that this is short-sighted: the long-term savings on public health, cooling costs, and social services far outweigh the investment required for maintenance.",
                'questions' => [
                    [1, 'Why do urban planners often sacrifice green spaces?', 'They view green spaces as a luxury rather than a necessity.'],
                    [2, 'What measurable effect does a ten-minute walk in a park have?', 'It reduces cortisol, the body\'s primary stress hormone.'],
                    [3, 'Explain the urban heat island effect as described in the passage.', 'Built environments trap heat and become significantly warmer than surrounding rural areas.'],
                    [4, 'What social benefit do green spaces provide?', 'They allow people from different backgrounds to interact, reducing social isolation and strengthening community cohesion.'],
                    [5, 'What is the main argument of advocates who oppose cuts to park funding?', 'Long-term savings on public health, cooling costs, and social services outweigh the cost of maintenance.'],
                ],
            ],
            [
                'title' => 'The Psychology of Habit Formation', 'topic' => 'Psychology', 'level' => 'b2', 'word_count' => 270,
                'body'  => "Habits are the invisible architecture of daily life. Research in behavioural psychology suggests that roughly 40 per cent of our daily actions are not conscious decisions but automatic responses triggered by specific environmental cues. Understanding how habits form — and how they can be changed — has become a significant focus of both scientific research and popular self-help literature.\n\nThe neurological basis of habit formation was clarified by studies at the Massachusetts Institute of Technology. Scientists discovered that the basal ganglia, a region of the brain associated with emotional processing, plays a central role in storing and executing habitual behaviours. When an action is repeated sufficiently, it becomes encoded as a routine, allowing the brain to perform it with minimal conscious effort. This efficiency is adaptive: it frees up cognitive resources for complex problem-solving.\n\nResearchers Charles Duhigg and Ann Graybiel describe the habit loop as consisting of three components: a cue, a routine, and a reward. The cue triggers the behaviour; the routine is the behaviour itself; and the reward reinforces it, training the brain to seek out the cue in future. Crucially, the reward does not need to be immediate or tangible — the anticipation of a reward is often sufficient to sustain a habit.\n\nBreaking an unwanted habit requires interrupting this loop, typically by substituting a new routine in response to the same cue. This strategy is considerably more effective than attempting to eliminate the cue entirely, which is rarely practical. Consistent repetition of the replacement behaviour gradually overwrites the old neural pathway — though researchers caution that the original habit is never fully erased and can resurface under stress.",
                'questions' => [
                    [1, 'What proportion of daily actions does research suggest are automatic?', 'Roughly 40 per cent.'],
                    [2, 'What role does the basal ganglia play in habit formation?', 'It stores and executes habitual behaviours; repeated actions are encoded as routines requiring minimal conscious effort.'],
                    [3, 'Why does the passage describe the brain\'s habit-forming tendency as "adaptive"?', 'Because it frees up cognitive resources for complex problem-solving.'],
                    [4, 'Identify the three components of the habit loop.', 'A cue (the trigger), a routine (the behaviour), and a reward (which reinforces the behaviour).'],
                    [5, 'What caution does the passage add about breaking habits?', 'The original habit is never fully erased and can resurface under stress.'],
                ],
            ],
            [
                'title' => 'Artificial Intelligence and the Future of Work', 'topic' => 'Technology', 'level' => 'b2', 'word_count' => 272,
                'body'  => "Few developments in recent decades have generated as much anxiety — and as much enthusiasm — as the rapid advance of artificial intelligence. Proponents argue that AI will eliminate repetitive, dangerous, and menial tasks, freeing workers for more creative and socially meaningful roles. Critics, however, warn that the transition may be far more disruptive than previous technological revolutions, threatening not just routine manual work but a broad range of professional and cognitive occupations.\n\nHistorical analogies are frequently invoked in these debates. The Industrial Revolution displaced millions of agricultural labourers, yet ultimately generated far more jobs than it destroyed by creating entirely new industries. Optimists argue that AI will follow the same pattern, stimulating demand for roles that do not yet exist and that humans are uniquely suited to perform.\n\nThis perspective is contested. Unlike earlier technologies, AI systems can learn, adapt, and in some domains already outperform human experts. Legal document review, medical image analysis, financial risk assessment, and customer service are among the sectors already experiencing significant automation. The concern is not merely that jobs will change but that the pace of change will outstrip the capacity of education systems and labour markets to adapt.\n\nGovernments and international institutions have responded with a range of policy proposals: retraining programmes, universal basic income pilots, and regulatory frameworks designed to slow deployment in particularly sensitive sectors. Most economists agree that disruption is likely to be uneven, disproportionately affecting low-income workers and developing economies. The central challenge, many argue, is not whether AI will transform work — that much seems inevitable — but whether societies can ensure that the gains are equitably distributed.",
                'questions' => [
                    [1, 'What argument do proponents of AI make about its impact on workers?', 'That AI will eliminate repetitive and dangerous tasks, freeing workers for more creative and meaningful roles.'],
                    [2, 'What historical example does the passage use to support an optimistic view?', 'The Industrial Revolution, which ultimately created more jobs than it displaced by generating new industries.'],
                    [3, 'Why does the passage suggest AI may be more disruptive than earlier technologies?', 'Because AI can learn and adapt, already outperforming human experts in some domains — threatening professional and cognitive jobs, not just manual ones.'],
                    [4, 'Name two sectors already experiencing significant automation.', 'Any two from: legal document review, medical image analysis, financial risk assessment, customer service.'],
                    [5, 'What does the passage identify as the central challenge posed by AI?', 'Not whether AI will transform work, but whether societies can ensure the gains are equitably distributed.'],
                ],
            ],
            [
                'title' => 'The Hidden Cost of Fast Fashion', 'topic' => 'Environment', 'level' => 'b2', 'word_count' => 264,
                'body'  => "The fashion industry is among the most polluting sectors in the global economy. The rise of so-called fast fashion — a business model predicated on producing large volumes of cheaply made clothing at rapid intervals — has dramatically accelerated the consumption and disposal of garments. A report by the Ellen MacArthur Foundation estimated that the equivalent of one rubbish truck of textiles is landfilled or incinerated every second worldwide.\n\nThe environmental costs are substantial. Cotton cultivation, which accounts for roughly a quarter of global pesticide use, depletes soil and contaminates waterways. Synthetic fibres such as polyester shed microscopic plastic particles — known as microfibres — when washed. These particles pass through sewage treatment systems and accumulate in oceans, rivers, and ultimately the food chain. Dyeing and finishing processes in textile manufacturing are responsible for approximately 20 per cent of global industrial water pollution.\n\nBeyond environmental damage, fast fashion raises serious ethical concerns. Much of the world's clothing is produced in countries where labour protections are weak and wages are low. The collapse of the Rana Plaza garment factory in Bangladesh in 2013, which killed over 1,100 workers, brought international attention to the dangerous working conditions prevalent in the industry's supply chains.\n\nConsumer awareness has grown in response, giving rise to movements promoting sustainable and second-hand fashion. Some brands have introduced take-back schemes and recycling programmes, though critics argue these initiatives are largely cosmetic and designed to deflect scrutiny from fundamentally unsustainable production volumes. Systemic change, many argue, requires regulation rather than voluntary corporate pledges.",
                'questions' => [
                    [1, 'How does the passage illustrate the scale of textile waste globally?', 'The equivalent of one rubbish truck of textiles is landfilled or incinerated every second worldwide.'],
                    [2, 'What environmental problem is associated with washing synthetic fibres?', 'They shed microfibres — microscopic plastic particles — that accumulate in oceans, rivers, and the food chain.'],
                    [3, 'What percentage of global industrial water pollution does textile manufacturing contribute?', 'Approximately 20 per cent.'],
                    [4, 'What event drew international attention to working conditions in the garment industry?', 'The collapse of the Rana Plaza factory in Bangladesh in 2013, which killed over 1,100 workers.'],
                    [5, 'Why do critics argue that brands\' take-back schemes are insufficient?', 'They argue the initiatives are cosmetic and fail to address the fundamentally unsustainable volume of production.'],
                ],
            ],
            [
                'title' => 'Why Languages Die — and Why It Matters', 'topic' => 'Language & Culture', 'level' => 'b2', 'word_count' => 268,
                'body'  => "Linguists estimate that of the approximately 7,000 languages spoken in the world today, at least half will be extinct by the end of this century. The drivers of language death are well understood: economic pressure, urbanisation, and the dominance of global languages such as English, Mandarin, and Spanish create powerful incentives for speakers of smaller languages to shift towards more widely understood tongues. Parents, hoping to give their children access to education and economic opportunity, often raise them exclusively in a majority language, abandoning the ancestral one within a single generation.\n\nThe loss of a language represents more than cultural impoverishment. Each language encodes a unique way of perceiving and categorising the world. The Hopi language of the American Southwest, for instance, structures time in a fundamentally different way from European languages, lacking conventional grammatical tense. The Pirahã language of the Brazilian Amazon lacks recursion — the capacity to embed one clause within another — a feature long believed to be universal to all human languages. When these languages disappear, so too does the cognitive diversity they embody.\n\nEfforts to revitalise endangered languages have met with mixed results. Welsh in the United Kingdom, Māori in New Zealand, and Hebrew in Israel are frequently cited as relative success stories — cases where sustained institutional support, education policy, and community engagement reversed decades of decline. Linguists caution, however, that revitalisation requires more than classroom instruction. It demands the creation of social contexts in which the language is not merely studied but actively lived: spoken in homes, used in commerce, heard in popular media.",
                'questions' => [
                    [1, 'What proportion of today\'s languages may be extinct by the end of this century?', 'At least half of the approximately 7,000 languages spoken today.'],
                    [2, 'What factors does the passage identify as driving language death?', 'Economic pressure, urbanisation, and the dominance of global languages, which incentivise speakers to shift to more widely understood tongues.'],
                    [3, 'Give one example from the passage of how a language encodes a unique worldview.', 'The Hopi language structures time differently from European languages (or the Pirahã language lacks recursion).'],
                    [4, 'Which three languages does the passage cite as successful revitalisation cases?', 'Welsh (UK), Māori (New Zealand), and Hebrew (Israel).'],
                    [5, 'What does the passage say revitalisation requires beyond classroom instruction?', 'Social contexts in which the language is actively lived — spoken in homes, used in commerce, heard in popular media.'],
                ],
            ],

            // ── C1 ──
            [
                'title' => 'The Business of Happiness', 'topic' => 'Society', 'level' => 'c1', 'word_count' => 272,
                'body'  => "For much of modern history, economic policy rested on a simple assumption: that rising prosperity would reliably translate into rising wellbeing. Gross Domestic Product — the total monetary value of goods and services produced within a country — became the dominant measure of national success. Yet decades of research in the emerging field of happiness economics have called this assumption seriously into question.\n\nThe paradox was first articulated clearly by economist Richard Easterlin in 1974. Easterlin observed that while wealthier countries tend to report higher average levels of life satisfaction than poorer ones, increases in national income within a given country do not consistently produce sustained increases in reported happiness over time. This became known as the Easterlin Paradox. One widely cited explanation is that beyond a certain income threshold — estimated by researchers at between \$60,000 and \$100,000 per year — additional wealth yields rapidly diminishing returns in subjective wellbeing.\n\nMore recent research has sought to identify what does drive lasting increases in happiness. Strong and trusting social relationships emerge consistently as the most powerful predictor of life satisfaction across cultures and income groups. Autonomy — the sense that one's choices and actions are genuinely self-determined — is the second most frequently cited factor. Physical health, meaningful work, and active engagement with one's community also feature prominently. Material consumption, by contrast, is associated with only short-lived improvements in mood, a phenomenon psychologists term hedonic adaptation.\n\nA growing number of governments — including those of Bhutan, New Zealand, and Scotland — have responded by incorporating wellbeing indicators into national policy frameworks, treating citizen happiness not as a by-product of growth but as a legitimate policy objective in its own right.",
                'questions' => [
                    [1, 'What does the Easterlin Paradox describe?', 'That while wealthier countries report higher life satisfaction, increases in national income within a country do not consistently produce sustained increases in happiness over time.'],
                    [2, 'At what income level does research suggest additional wealth yields diminishing returns?', 'Between $60,000 and $100,000 per year.'],
                    [3, 'What factor most consistently predicts life satisfaction across cultures?', 'Strong and trusting social relationships.'],
                    [4, 'What does "hedonic adaptation" refer to in this passage?', 'The phenomenon whereby material consumption produces only short-lived improvements in mood.'],
                    [5, 'How have some governments responded to findings from happiness economics?', 'By incorporating wellbeing indicators into policy frameworks, treating citizen happiness as a policy objective rather than a by-product of growth.'],
                ],
            ],
            [
                'title' => 'The Neuroscience of Music', 'topic' => 'Arts & Science', 'level' => 'c1', 'word_count' => 270,
                'body'  => "Music is one of the few human activities that engages virtually every area of the brain simultaneously. Neuroscientists have used brain-imaging technologies to demonstrate that listening to music activates auditory regions, motor areas, the limbic system responsible for emotional processing, and even the cerebellum, which coordinates movement. This whole-brain engagement has led researchers to describe music as a kind of neural workout.\n\nOne of the most striking findings in music neuroscience is the brain's anticipatory response to music. As a piece of music unfolds, the brain continuously generates predictions about what will come next. When those expectations are met — or pleasurably violated — the brain releases dopamine, the neurotransmitter associated with reward and motivation. This mechanism explains why certain musical passages produce the physical sensation commonly described as chills or goosebumps.\n\nMusic also has measurable effects on cognition and wellbeing. Numerous studies have found that patients with memory-impairing conditions such as Alzheimer's disease retain the ability to recognise and respond emotionally to familiar music long after other forms of memory have deteriorated. This is thought to reflect the fact that musical memories are encoded across multiple brain regions simultaneously, making them more resilient to damage.\n\nIn clinical settings, music therapy has been applied to manage chronic pain, reduce anxiety before surgical procedures, and accelerate recovery from strokes. The evidence base has grown sufficiently robust that some health systems now offer music therapy as a funded treatment. Researchers caution, however, that not all music interventions are equivalent: the genre, tempo, and personal significance of a piece all mediate its psychological effects.",
                'questions' => [
                    [1, 'Why do researchers describe music as a "neural workout"?', 'Because it simultaneously engages virtually every area of the brain — auditory regions, motor areas, the limbic system, and the cerebellum.'],
                    [2, 'What neurological mechanism explains the physical sensation of chills while listening to music?', 'The brain generates predictions about the music; when expectations are met or pleasurably violated, dopamine is released.'],
                    [3, 'Why do Alzheimer\'s patients often retain musical memory after other memories have deteriorated?', 'Because musical memories are encoded across multiple brain regions simultaneously, making them more resilient to damage.'],
                    [4, 'Name two clinical applications of music therapy mentioned in the passage.', 'Any two from: managing chronic pain, reducing pre-surgical anxiety, accelerating stroke recovery.'],
                    [5, 'What caution do researchers add about music interventions?', 'Not all interventions are equivalent — genre, tempo, and personal significance all mediate psychological effects.'],
                ],
            ],
            [
                'title' => 'The Problem of Free Will', 'topic' => 'Philosophy', 'level' => 'c1', 'word_count' => 275,
                'body'  => "The question of whether human beings possess genuine free will — the capacity to act in a fundamentally undetermined way — has occupied philosophers for millennia. The debate divides broadly into three positions. Determinists hold that every event, including every human decision, is the inevitable result of prior causes operating according to fixed causal laws. Libertarians, in the philosophical rather than political sense, maintain that at least some human actions originate from a causally undetermined act of will. Compatibilists, who represent the dominant position in contemporary analytic philosophy, argue that free will and determinism are not in conflict: freedom consists not in acting outside the causal order but in acting in accordance with one's own reasons and desires, free from external compulsion.\n\nThe scientific dimension of the debate intensified following experiments conducted by neuroscientist Benjamin Libet in the 1980s. Libet found that the brain generates an electrical signal — the readiness potential — several hundred milliseconds before subjects report consciously deciding to act. Critics interpreted this as evidence that conscious will is an epiphenomenon: a post-hoc rationalisation of decisions the brain has already made. Subsequent researchers have challenged these conclusions on methodological grounds, arguing that Libet's experimental design fundamentally misrepresents the nature of voluntary action.\n\nThe stakes of the debate extend far beyond academic philosophy. Criminal justice systems in most societies are predicated on the assumption that individuals are morally responsible for their actions and can therefore justly be held accountable for them. If hard determinism were true, the concept of criminal responsibility would require radical revision — a prospect that many legal theorists regard as having urgent and unavoidable practical implications.",
                'questions' => [
                    [1, 'Identify the three main positions in the free will debate as described in the passage.', 'Determinism (all events are causally determined), libertarianism (some actions are causally undetermined), and compatibilism (free will and determinism are compatible).'],
                    [2, 'What do compatibilists argue, according to the passage?', 'That free will and determinism are not in conflict; freedom consists in acting according to one\'s own reasons and desires, free from external compulsion.'],
                    [3, 'What did Libet\'s experiments reveal, and how did critics interpret the findings?', 'The brain generates a readiness potential before subjects consciously decide to act; critics interpreted this as evidence that conscious will is a post-hoc rationalisation of decisions already made.'],
                    [4, 'On what grounds did subsequent researchers challenge Libet\'s conclusions?', 'On methodological grounds, arguing his experimental design fundamentally misrepresents the nature of voluntary action.'],
                    [5, 'Why does the passage argue the free will debate has "urgent practical implications"?', 'Because criminal justice systems assume moral responsibility; if hard determinism were true, the concept of criminal responsibility would require radical revision.'],
                ],
            ],
            [
                'title' => 'Behavioural Economics and the Architecture of Choice', 'topic' => 'Economics', 'level' => 'c1', 'word_count' => 268,
                'body'  => "Classical economic theory rests on the assumption of the rational agent — an idealised decision-maker who consistently maximises utility by selecting the option that best advances their preferences given available information. Decades of empirical research in cognitive psychology and behavioural economics have demonstrated, however, that this model bears little resemblance to how people actually make decisions. Human beings, it turns out, are systematically irrational in predictable ways.\n\nAmong the most influential contributions to this literature is the work of psychologists Daniel Kahneman and Amos Tversky, who identified a range of cognitive biases that distort judgement. Loss aversion — the tendency to weigh potential losses more heavily than equivalent gains — is one of the most robust and widely replicated findings. People, Kahneman and Tversky showed, will accept greater risk to avoid losing a given sum than to acquire the same amount. The endowment effect — the tendency to overvalue objects merely because one owns them — is a related phenomenon that undermines the classical assumption of preference consistency.\n\nThese insights gave rise to the concept of choice architecture: the idea that the way options are presented profoundly influences the choices people make, often independently of their stated preferences. Nudge theory, popularised by Thaler and Sunstein, proposes that carefully designed defaults can steer people towards beneficial outcomes without restricting their freedom of choice. Enrolling employees automatically in pension schemes, for example, dramatically increases participation rates by exploiting the human tendency towards inertia rather than by compelling action.\n\nCritics of nudge theory raise concerns about paternalism and democratic accountability, arguing that policymakers who design defaults make value-laden choices on citizens' behalf without adequate transparency or scrutiny.",
                'questions' => [
                    [1, 'What is the "rational agent" assumption in classical economic theory?', 'That decision-makers consistently maximise utility by selecting the option that best advances their preferences given available information.'],
                    [2, 'What did Kahneman and Tversky\'s research primarily demonstrate?', 'That human beings are systematically irrational in predictable ways, due to cognitive biases such as loss aversion and the endowment effect.'],
                    [3, 'Define loss aversion as described in the passage.', 'The tendency to weigh potential losses more heavily than equivalent gains — people accept greater risk to avoid losing a sum than to acquire it.'],
                    [4, 'What is "choice architecture" and how does nudge theory apply it?', 'Choice architecture is the idea that how options are presented influences choices; nudge theory uses designed defaults to steer people towards beneficial outcomes without restricting freedom.'],
                    [5, 'What criticism do opponents of nudge theory raise?', 'That policymakers who design defaults make value-laden choices on citizens\' behalf without adequate transparency or democratic scrutiny.'],
                ],
            ],
        ];

        foreach ($passages as $p) {
            $passage = ReadingPassage::updateOrCreate(
                ['title' => $p['title']],
                ['body' => $p['body'], 'level' => $p['level'], 'topic' => $p['topic'], 'word_count' => $p['word_count']]
            );

            foreach ($p['questions'] as [$pos, $qText, $modelAnswer]) {
                ReadingQuestion::updateOrCreate(
                    ['passage_id' => $passage->id, 'position' => $pos],
                    ['question_text' => $qText, 'model_answer' => $modelAnswer]
                );
            }
        }
    }

    private function seedSpeakingPrompts(): void
    {
        $prompts = [
            // ── B2 — Personal Development ──
            ['level' => 'b2', 'topic' => 'Personal development', 'target_seconds' => 120,
                'text' => 'Describe a skill you would like to learn.',
                'cue_points' => ['what the skill is', 'why you want to learn it', 'how you would go about learning it', 'what difference it would make to your life']],
            ['level' => 'b2', 'topic' => 'Personal development', 'target_seconds' => 120,
                'text' => 'Describe a challenge you have overcome and what it taught you about yourself.',
                'cue_points' => ['what the challenge was', 'how it affected you at the time', 'the steps you took to address it', 'what lasting lesson it revealed']],

            // ── B2 — Travel ──
            ['level' => 'b2', 'topic' => 'Travel', 'target_seconds' => 120,
                'text' => 'Describe a memorable journey or trip you have taken.',
                'cue_points' => ['where you went and when', 'who you travelled with', 'what you did or saw there', 'why this trip was particularly memorable']],
            ['level' => 'b2', 'topic' => 'Travel', 'target_seconds' => 120,
                'text' => 'Is it better to explore your own country deeply or to travel abroad as widely as possible? Defend your view.',
                'cue_points' => ['the main advantage of your preferred approach', 'what you believe travel should ultimately achieve', 'a drawback of the alternative approach', 'a personal experience that supports your position']],

            // ── B2 — Arts & Culture ──
            ['level' => 'b2', 'topic' => 'Arts & culture', 'target_seconds' => 120,
                'text' => 'Describe a book, film, or piece of music that had a significant impact on you.',
                'cue_points' => ['what it is and when you first encountered it', 'what it is about or what it involves', 'how it made you feel at the time', 'why it has stayed with you']],

            // ── B2 — Work & Career ──
            ['level' => 'b2', 'topic' => 'Work & career', 'target_seconds' => 120,
                'text' => 'Describe a job or career path you consider both challenging and fulfilling.',
                'cue_points' => ['what the role involves on a day-to-day basis', 'why it appeals to you specifically', 'what skills or qualities it demands', 'how it contributes to society or to others']],
            ['level' => 'b2', 'topic' => 'Work & career', 'target_seconds' => 120,
                'text' => 'How important is maintaining a healthy work-life balance, and what practical steps can people take to achieve it?',
                'cue_points' => ['why work-life balance matters for wellbeing and productivity', 'factors in modern work culture that make balance difficult', 'one practical strategy that you believe is effective', 'whether responsibility lies with individuals, employers, or governments']],

            // ── B2 — Technology ──
            ['level' => 'b2', 'topic' => 'Technology', 'target_seconds' => 120,
                'text' => 'Discuss how technology has changed the way people interact with one another, and whether these changes are largely positive or negative.',
                'cue_points' => ['a significant positive change technology has brought to communication', 'a social consequence you consider harmful or concerning', 'how your own relationships have been affected', 'what you believe the future of human connection looks like']],
            ['level' => 'b2', 'topic' => 'Technology', 'target_seconds' => 120,
                'text' => 'What technological development do you believe will have the greatest impact on society over the next twenty years?',
                'cue_points' => ['what the development is and how it works at a basic level', 'why its impact will surpass that of other emerging technologies', 'a potential benefit it could bring to everyday life', 'a risk or ethical concern it raises']],

            // ── B2 — Environment ──
            ['level' => 'b2', 'topic' => 'Environment', 'target_seconds' => 120,
                'text' => 'What do you believe is the single most effective action individuals can take to reduce their environmental impact?',
                'cue_points' => ['what the action is and why you chose it above others', 'how realistic it is for most people to adopt', 'what barriers might prevent people from making this change', 'whether individual action alone is sufficient or whether systemic change is needed']],

            // ── B2 — Education ──
            ['level' => 'b2', 'topic' => 'Education', 'target_seconds' => 120,
                'text' => 'Describe a teacher, mentor, or educational experience that had a lasting influence on the way you think or learn.',
                'cue_points' => ['who it was or what the experience involved', 'what made it stand out from others', 'how it changed your approach to a subject or to learning in general', 'the advice or insight you still carry with you today']],

            // ── B2 — Society & Culture ──
            ['level' => 'b2', 'topic' => 'Society & culture', 'target_seconds' => 120,
                'text' => 'Describe a tradition, festival, or cultural practice from your background that you find particularly meaningful.',
                'cue_points' => ['what the tradition or practice involves', 'its historical or cultural origins', 'why it holds personal significance for you', 'how it has evolved or changed across generations']],

            // ── B2 — Health ──
            ['level' => 'b2', 'topic' => 'Health & wellbeing', 'target_seconds' => 120,
                'text' => 'How important is mental health awareness in modern society, and do you think the issue is taken seriously enough?',
                'cue_points' => ['your view on the current level of public awareness', 'a common misconception or stigma that still exists', 'how schools or workplaces could do more', 'a personal or observed example of how attitudes are changing']],

            // ── C1 — Arts & Culture ──
            ['level' => 'c1', 'topic' => 'Arts & culture', 'target_seconds' => 150,
                'text' => 'To what extent do the arts — music, literature, and visual art — shape our values and worldview rather than merely reflecting them?',
                'cue_points' => ['a specific work or cultural movement that actively shifted societal values', 'how art can challenge prevailing assumptions in ways that argument alone cannot', 'whether the arts receive sufficient attention in formal education', 'a personal experience of art fundamentally altering your perspective on an issue']],

            // ── C1 — Society & Culture ──
            ['level' => 'c1', 'topic' => 'Society & culture', 'target_seconds' => 150,
                'text' => 'How important is it to preserve minority languages and regional dialects in an increasingly globalised world, and who bears the primary responsibility for doing so?',
                'cue_points' => ['why linguistic diversity matters beyond its practical communicative value', 'the economic and social forces that erode minority languages', 'an example of a successful revitalisation effort and what made it work', 'where responsibility lies — individuals, communities, or governments']],

            // ── C1 — Philosophy & Ethics ──
            ['level' => 'c1', 'topic' => 'Philosophy & ethics', 'target_seconds' => 150,
                'text' => 'To what extent is genuine objectivity achievable? Discuss with reference to journalism, scientific research, or everyday decision-making.',
                'cue_points' => ['what objectivity means and why it is considered desirable', 'a specific domain where achieving it proves especially difficult', 'the cognitive or structural factors that undermine it', 'whether striving for objectivity remains worthwhile even if it is never fully attained']],
            ['level' => 'c1', 'topic' => 'Philosophy & ethics', 'target_seconds' => 150,
                'text' => 'Describe a situation in which following established rules or conventions led to an outcome you considered unjust. What does this reveal about the limits of law and the role of moral judgement?',
                'cue_points' => ['what the situation involved and what rule or convention was being followed', 'why the outcome struck you as unjust despite its technical legality', 'what a more morally sensitive response might have looked like', 'what this suggests about the relationship between law and ethics more broadly']],

            // ── C1 — Future & Society ──
            ['level' => 'c1', 'topic' => 'Future & global issues', 'target_seconds' => 150,
                'text' => 'What major global challenge do you think the next generation will face, and what gives you hope about their capacity to address it?',
                'cue_points' => ['which challenge you believe is most pressing and why', 'why it may intensify rather than diminish in coming decades', 'qualities you observe in young people today that inspire confidence', 'one concrete structural change that would most improve the outlook']],
            ['level' => 'c1', 'topic' => 'Future & global issues', 'target_seconds' => 150,
                'text' => 'Is the concept of "progress" still a meaningful and useful idea, or has it become a problematic assumption? Discuss with reference to history, technology, or social change.',
                'cue_points' => ['what progress has conventionally meant and why the concept has been so influential', 'a domain where the narrative of progress obscures more than it reveals', 'an example where what looked like progress later appeared more ambiguous', 'whether abandoning the concept altogether would be more honest or more harmful']],

            // ── C1 — Economics & Power ──
            ['level' => 'c1', 'topic' => 'Economics & society', 'target_seconds' => 150,
                'text' => 'Is meritocracy a genuinely fair system, or does it function as a justification for inequality by attributing structural disadvantage to individual failure?',
                'cue_points' => ['what the meritocratic ideal promises and why it is appealing', 'the structural barriers that undermine meritocracy in practice', 'how meritocratic rhetoric can be used to deflect attention from systemic injustice', 'whether the concept is worth reforming or should be abandoned altogether']],
        ];

        foreach ($prompts as $p) {
            SpeakingPrompt::updateOrCreate(['text' => $p['text']], $p);
        }
    }

    private function seedListeningPassages(): void
    {
        $passages = [
            [
                'title'  => 'The Hidden Costs of Fast Fashion',
                'topic'  => 'Environment',
                'level'  => 'b2',
                'script' => "Fast fashion has revolutionised the way people buy clothes, making trendy styles available at very low prices. However, the environmental cost of this convenience is enormous. The fashion industry is responsible for around ten percent of global carbon emissions, more than international aviation and shipping combined. Most fast fashion garments are made from synthetic fibres such as polyester, which are derived from fossil fuels and can take hundreds of years to decompose in landfill. Consumers are encouraged to buy more and discard items quickly, creating a cycle of waste. In many countries, clothing is now treated as almost disposable. Studies suggest that the average garment is worn fewer than ten times before being thrown away. Water consumption is another critical issue. Producing a single pair of jeans requires approximately 7,500 litres of water — equivalent to about seven years of drinking water for one person. The dyeing and finishing of textiles is also a major source of water pollution in manufacturing countries. Some brands have begun to address these concerns by introducing recycled materials, take-back schemes, and transparency reports. However, critics argue that these measures are largely cosmetic and do not challenge the fundamental business model of volume-based profit. A genuine shift would require consumers to buy less, pay more, and keep clothes longer — changes that run counter to the entire fast fashion proposition.",
                'questions' => [
                    [1, 'What percentage of global carbon emissions does the fashion industry produce?', 'The fashion industry produces around ten percent of global carbon emissions.'],
                    [2, 'Why are synthetic fibres considered environmentally problematic?', 'Synthetic fibres are derived from fossil fuels and can take hundreds of years to decompose in landfill.'],
                    [3, 'How much water is required to produce a single pair of jeans?', 'Producing a single pair of jeans requires approximately 7,500 litres of water.'],
                    [4, 'What measures have some brands introduced to address environmental concerns?', 'Some brands have introduced recycled materials, take-back schemes, and transparency reports.'],
                    [5, 'Why do critics argue that brand initiatives are insufficient?', 'Critics argue the measures are largely cosmetic and do not challenge the fundamental business model of volume-based profit.'],
                ],
            ],
            [
                'title'  => 'How Sleep Shapes Memory Consolidation',
                'topic'  => 'Science',
                'level'  => 'b2',
                'script' => "Sleep is not merely a period of rest — it plays an active and essential role in the consolidation of memory. During sleep, the brain replays experiences from the day and transfers information from short-term to long-term storage. This process occurs primarily during slow-wave sleep, also known as deep sleep, when large, synchronised waves of neural activity sweep across the cortex. Neuroscientists have found that the hippocampus, a region critical for forming new memories, communicates with the prefrontal cortex during this stage, effectively filing recent experiences into stable long-term representations. Dreaming, which occurs mainly during rapid eye movement sleep, may serve a different function — helping the brain to process emotional memories and identify patterns across unrelated experiences. Research has shown that people who sleep after learning a new skill retain it significantly better than those who remain awake. In one widely cited study, participants who learned a finger-tapping sequence and then slept showed a thirty percent improvement in speed and accuracy compared with those tested after an equal period of wakefulness. The implication for students and professionals is clear: sacrificing sleep to study or practise may be counterproductive. The hours of sleep that follow learning are not wasted time but are, in fact, an integral part of the learning process itself.",
                'questions' => [
                    [1, 'What is the primary role of sleep in relation to memory?', 'Sleep plays an active role in consolidating memory, transferring information from short-term to long-term storage.'],
                    [2, 'During which sleep stage does memory consolidation primarily occur?', 'Memory consolidation occurs primarily during slow-wave (deep) sleep.'],
                    [3, 'What brain regions communicate during memory consolidation in sleep?', 'The hippocampus communicates with the prefrontal cortex during slow-wave sleep.'],
                    [4, 'What did the finger-tapping study show about sleep and skill retention?', 'Participants who slept after learning showed a thirty percent improvement in speed and accuracy compared to those who stayed awake.'],
                    [5, 'What is the implication for students according to the passage?', 'Sacrificing sleep to study may be counterproductive; sleep after learning is an integral part of the learning process.'],
                ],
            ],
            [
                'title'  => 'The Epistemology of Scientific Consensus',
                'topic'  => 'Philosophy',
                'level'  => 'c1',
                'script' => "Scientific consensus is often invoked as the gold standard of reliable knowledge, yet the epistemological foundations of consensus remain philosophically contentious. Consensus, strictly speaking, is a sociological phenomenon — an agreement among experts — and its epistemic value depends on how that agreement was reached. When consensus emerges from independent lines of evidence, rigorous peer review, and the repeated failure of falsification attempts, it carries significant evidential weight. However, when consensus is the product of shared assumptions, institutional pressures, or the marginalisation of dissenting voices, it may obscure rather than illuminate the truth. The history of science is replete with examples of consensus views that were later overturned — from the geocentric model of the universe to the belief that ulcers were caused by stress rather than bacterial infection. These reversals do not invalidate the concept of consensus; they demonstrate that it must always remain provisional and open to revision. A further complication arises from the distinction between first-order scientific questions and second-order policy questions. While the scientific consensus on anthropogenic climate change is extraordinarily robust, the policy responses to that consensus involve value judgements and trade-offs that lie beyond the remit of science itself. Conflating the two domains risks both misrepresenting the nature of scientific authority and reducing legitimate policy debates to questions of factual denial. Intellectual humility — the recognition that one's current best theory may be wrong — is therefore essential not only for individual scientists but for the institutions and publics that rely on their findings.",
                'questions' => [
                    [1, 'What does the author mean by describing consensus as a "sociological phenomenon"?', 'Consensus is an agreement among experts rather than an intrinsic property of truth; its value depends on how the agreement was reached.'],
                    [2, 'Under what conditions does scientific consensus carry significant evidential weight?', 'When it emerges from independent lines of evidence, rigorous peer review, and repeated failure of falsification attempts.'],
                    [3, 'What historical examples does the author use to illustrate that consensus can be wrong?', 'The geocentric model of the universe and the belief that ulcers were caused by stress rather than bacterial infection.'],
                    [4, 'What distinction does the author draw between first-order and second-order questions?', 'First-order questions are scientific (e.g., the reality of climate change); second-order policy questions involve value judgements beyond the remit of science.'],
                    [5, 'Why does the author argue that intellectual humility is essential?', 'Because any current best theory may be wrong; both scientists and institutions must remain open to revision and correction.'],
                ],
            ],
            [
                'title'  => 'Urbanisation and the Erosion of Social Trust',
                'topic'  => 'Society',
                'level'  => 'c1',
                'script' => "Social trust — the generalised confidence that strangers will behave honestly and predictably — is widely regarded as a prerequisite for functional societies. Yet contemporary urbanisation presents a paradox: cities are engines of economic productivity and cultural innovation, yet research consistently finds that urban residents exhibit lower levels of generalised trust than their rural counterparts. Several mechanisms have been proposed to account for this divergence. Heterogeneity theory suggests that the greater ethnic, cultural, and socioeconomic diversity of cities reduces trust by undermining the shared norms and identities that facilitate cooperation. Robert Putnam's influential but controversial research on social capital found that diversity was negatively correlated with trust even after controlling for income inequality and other confounders. Critics, however, argue that the relationship between diversity and trust is mediated by inequality rather than diversity per se — that it is the experience of deprivation alongside visible affluence, rather than cultural difference itself, that erodes the expectation of mutual goodwill. A third perspective focuses on anonymity. Urban environments are characterised by repeated encounters with strangers in contexts that offer little opportunity for the reciprocal interactions that build trust over time. In contrast, the relative stability and smaller scale of rural communities facilitate the kind of repeated interaction that game theory identifies as foundational to cooperative equilibria. The policy implications of these findings remain contested, but most analysts agree that urban design, inclusive public spaces, and investment in community infrastructure can partially compensate for the structural trust deficit of dense cities.",
                'questions' => [
                    [1, 'How does the passage define social trust?', 'Social trust is the generalised confidence that strangers will behave honestly and predictably.'],
                    [2, "What is the core claim of heterogeneity theory regarding trust?", 'Greater diversity reduces trust by undermining the shared norms and identities that facilitate cooperation.'],
                    [3, "What do critics of Putnam's research argue about the real cause of reduced trust?", 'Critics argue that inequality rather than diversity per se erodes trust — experiencing deprivation alongside visible affluence reduces mutual goodwill.'],
                    [4, 'How does anonymity in cities affect the development of trust?', 'Urban anonymity limits repeated interactions that build trust; rural stability enables the repeated encounters game theory identifies as foundational to cooperation.'],
                    [5, 'What do analysts suggest can partly compensate for the urban trust deficit?', 'Urban design, inclusive public spaces, and investment in community infrastructure can partially compensate.'],
                ],
            ],
        ];

        foreach ($passages as $pData) {
            $passage = ListeningPassage::updateOrCreate(
                ['title' => $pData['title']],
                [
                    'audio_script' => $pData['script'],
                    'topic'        => $pData['topic'],
                    'level'        => $pData['level'],
                    'word_count'   => str_word_count($pData['script']),
                ]
            );

            foreach ($pData['questions'] as [$pos, $qText, $mAnswer]) {
                ListeningQuestion::updateOrCreate(
                    ['passage_id' => $passage->id, 'position' => $pos],
                    ['question_text' => $qText, 'model_answer' => $mAnswer]
                );
            }
        }
    }

    private function seedDemoUser(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test User', 'password' => Hash::make('password'), 'level' => 'b2']
        );

        Streak::firstOrCreate(
            ['user_id' => $user->id],
            ['current_days' => 0, 'longest_days' => 0]
        );
    }
}
