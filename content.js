// Scenario content for "The Room That Went Quiet".
// Points are kept on the server; learners only see them after answering.
module.exports = {
  title: 'The Room That Went Quiet',
  subtitle: 'A Meridian Gulf Group Learning Simulation — Module 6: Delivery Techniques for Trainers',
  module: 'Module 6 — Delivery Techniques for Trainers',
  intro:
    "Grace Wanjiru has delivered this compliance session many times before, always successfully. Today, engagement collapses fast — then two participants leave and don't come back. You're stepping into her shoes right as the room starts to go quiet, with only what she can see in front of her.",
  objectives: [
    'Read the signs of a room losing engagement before it becomes a walkout.',
    'Choose an in-the-moment response that recovers a group instead of shutting it down or ignoring it.',
    'Recognise when a "difficult room" has nothing to do with the training content at all.',
  ],
  rounds: [
    {
      time: '10:20',
      title: 'The first signs',
      situation:
        "Twenty minutes in. Grace asks an open question about the gifts-and-hospitality policy. Silence. Two people at the back are whispering, a team lead keeps checking his phone, and the answers she does get are one word long. Yesterday's group, with the same slides, was lively.",
      question: 'What do you do next?',
      options: [
        { id: 'A', text: 'Speed up through the slides so the session finishes on time and nobody is kept longer than needed.', points: 0,
          feedback: 'Speeding up treats the symptom as a timing problem. The room is telling you something, and racing ahead means you stop reading it.' },
        { id: 'B', text: 'Stop and ask the whole room, "Is everything okay? You all seem distracted."', points: 4,
          feedback: 'Naming it is better than ignoring it, but asking a whole group to explain itself in public rarely gets an honest answer — it can feel like being called out.' },
        { id: 'C', text: 'Switch to a short pair activity applying the policy to a real case from their department, and walk the room while they work.', points: 10,
          feedback: 'Strong choice. A change of activity re-engages people, and walking the room lets you hear what is really on their minds without putting anyone on the spot.' },
        { id: 'D', text: 'Remind everyone that this is mandatory compliance training and attention is expected.', points: 0,
          feedback: 'Pulling rank gets compliance at best, and shuts down the conversation you need to have. Disengagement goes underground.' },
      ],
    },
    {
      time: '10:35',
      title: 'Two people walk out',
      situation:
        "Midway through a case study, Omar and Leila from Finance Operations stand up and leave without a word. The door closes. Every head turns to Grace to see what she will do.",
      question: 'How do you respond in the moment?',
      options: [
        { id: 'A', text: 'Carry on as if nothing happened, to avoid drawing more attention to it.', points: 3,
          feedback: 'Keeping calm is good, but pretending nothing happened leaves the rest of the room unsettled and guessing. Everyone saw it.' },
        { id: 'B', text: 'Calmly call a five-minute break, then step out to check in privately and kindly with the two who left.', points: 10,
          feedback: 'Excellent. A break resets the room, and a private, non-judgemental check-in is the fastest way to learn what is actually going on.' },
        { id: 'C', text: 'Note their names so you can report them to HR as not completing the session.', points: 0,
          feedback: 'Reaching for discipline before understanding the cause damages trust with the whole group — and you still do not know why they left.' },
        { id: 'D', text: 'Lighten the mood with a joke: "Was it something I said?"', points: 2,
          feedback: 'Humour can help, but here it can sound dismissive to people who may be genuinely upset. Read the room before joking about it.' },
      ],
    },
    {
      time: '10:45',
      title: 'What is really going on?',
      situation:
        "During the break, a participant quietly tells Grace that at 9:45 an email went out announcing a restructure of Finance Operations. Half the people in the room are in that team. Omar and Leila were called to a meeting with their manager.",
      question: 'What is the most accurate reading of the room?',
      options: [
        { id: 'A', text: 'The content is too dry for this audience; the session needs redesigning.', points: 0,
          feedback: 'The same content worked yesterday. Blaming the material sends you off to fix the wrong problem.' },
        { id: 'B', text: "The group is anxious about news that has nothing to do with the training — the restructure announced this morning.", points: 10,
          feedback: 'Correct. This is a "difficult room" caused entirely by something outside the session. Recognising that changes everything about how you respond.' },
        { id: 'C', text: 'This group is resistant to compliance training in general.', points: 2,
          feedback: 'Labelling a group as resistant is tempting, but the evidence points to a specific event this morning, not a general attitude.' },
        { id: 'D', text: 'Grace has lost credibility with the group and needs to win them back.', points: 2,
          feedback: 'Taking it personally is natural, but it is not about Grace. Seeing that clearly helps you respond with calm rather than defensiveness.' },
      ],
    },
    {
      time: '11:00',
      title: 'Restarting the session',
      situation:
        "The group comes back from the break. Omar and Leila are not with them. People are quiet and clearly distracted. There are 90 minutes of content left, including two items the regulator requires.",
      question: 'How do you restart?',
      options: [
        { id: 'A', text: 'Acknowledge it briefly: "I know today has brought big news. I can\'t speak to it, but let\'s agree how to use our time." Cover the two required items, and move the rest to a later date.', points: 10,
          feedback: 'Best response. You name the elephant without stepping outside your role, give the group some control, and protect what must be covered.' },
        { id: 'B', text: "Say nothing about it and continue exactly where you stopped, to keep things professional.", points: 2,
          feedback: 'Everyone knows that you know. Ignoring it widens the gap between you and the room and learning will stay low.' },
        { id: 'C', text: 'Open a group discussion about the restructure so people can get their feelings out.', points: 4,
          feedback: 'Well-meant, but you have no facts about the restructure and it is not your conversation to lead. It can make anxiety worse and lose the session.' },
        { id: 'D', text: 'Cancel the rest of the session and send everyone back to work.', points: 5,
          feedback: 'Respectful of their state, but the required compliance items stay undone. A shortened, focused session is usually a better balance.' },
      ],
    },
    {
      time: '12:30',
      title: 'After the session',
      situation:
        'The session is over. The L&D manager who sponsored it will see the attendance sheet and feedback scores, which are lower than usual. Omar and Leila never returned.',
      question: 'What do you do next?',
      options: [
        { id: 'A', text: 'Submit the attendance and feedback as normal; the scores will speak for themselves.', points: 0,
          feedback: 'Without context, the numbers tell the wrong story — about the content, the trainer, and the two people who left.' },
        { id: 'B', text: 'Brief the sponsor: what happened, what was covered, what was not, and propose a short catch-up for Omar, Leila and the postponed items.', points: 10,
          feedback: 'Exactly right. Clear reporting protects the participants, the compliance record and your own credibility, and turns a bad day into a plan.' },
        { id: 'C', text: 'Mark Omar and Leila as "did not complete" and leave follow-up to HR.', points: 0,
          feedback: 'Technically accurate, but it penalises people for something outside their control and misses the chance to help.' },
        { id: 'D', text: 'Email all participants apologising for a session that did not go well.', points: 3,
          feedback: 'Kind, but it implies the training was the problem. A word with the sponsor and a clear follow-up plan does more good.' },
      ],
    },
  ],
  debrief: [
    { heading: 'Read the signs early', text: 'Short answers, side conversations and phones are data. A sudden change from a group that usually engages is a signal to look up from the slides.' },
    { heading: 'Recover, don\'t shut down', text: 'Change the activity, call a break, check in privately. Avoid both ignoring the problem and pulling rank.' },
    { heading: "It isn't always about you", text: "Sometimes the room is reacting to something outside the training. Name it briefly, stay within your role, and protect what must be covered." },
  ],
};
