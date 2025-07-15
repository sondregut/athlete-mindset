import * as XLSX from 'xlsx';

// Create sample data based on user's example
const sampleData = [
  ['Step_ID', 'Template_Text', 'Pole Vault', 'Horizontal Jumps', 'High Jump', 'Distance Running', 'Sprinting', 'Throws'],
  [
    'Step_1',
    'Find a comfortable position...',
    'Find a comfortable position...',
    'Find a comfortable position...',
    'Find a comfortable position...',
    'Find a comfortable position...',
    'Find a comfortable position...',
    'Find a comfortable position...'
  ],
  [
    'Step_2',
    'Focus:',
    'Start by bringing your attention to the specific height you are vaulting.',
    'Start by bringing your attention to the specific distance you will jump.',
    'Start by bringing your attention to the specific height you will clear.',
    'Start by bringing your attention to the race you are running and the time you are chasing.',
    'Start by bringing your attention to the finish line and a flawless execution.',
    'Start by bringing your attention to the specific distance mark you will hit.'
  ],
  [
    'Step_3',
    'Visualise the end result:',
    'Start seeing yourself successfully clearing the height. You arch over the bar, land on the mat, and see the bar stay on.',
    'Start seeing yourself successfully hitting the board perfectly and flying through the air, landing deep in the sand.',
    'Start seeing yourself successfully clearing the height. You take off powerfully, arching your back over the bar and landing cleanly.',
    'Start seeing yourself successfully finishing the race. You cross the finish line, feeling strong, and see the clock with your target time.',
    'Start seeing yourself successfully exploding from the blocks. You accelerate perfectly and lean at the tape, crossing the finish line first.',
    'Start seeing yourself successfully unleashing a powerful throw. You see the implement flying in a perfect arc and landing far out in the sector.'
  ],
  [
    'Step_4',
    'Add details:',
    'What can you hear? The crowd clapping rhythmically? The announcer calling your name?',
    'What can you hear? The official calling out your huge distance? The applause from the crowd?',
    'What can you hear? The collective gasp of the crowd, followed by a roar as you clear the bar?',
    'What can you hear? The sound of the bell for the final lap? The roar of the crowd on the home stretch?',
    'What can you hear? The sound of the starter\'s gun? The roar of the stadium for the 10 seconds of the race?',
    'What can you hear? The sound of your own powerful grunt on release? The official marking your throw?'
  ],
  [
    'Step_5',
    'Go deeper:',
    'What are you wearing? Feel the chalk on your hands and the grip on the pole. You are celebrating on the landing pit.',
    'What are you wearing? Feel the explosive power in your legs on takeoff. You are celebrating next to the sandpit.',
    'What are you wearing? Feel the weightless sensation at the peak of your jump. You are celebrating on the landing mat.',
    'What are you wearing? Feel the rhythm of your stride and breath. You are catching your breath past the finish line, arms raised.',
    'What are you wearing? Feel the power in your arm drive and leg turnover. You are slowing down past the finish line, looking at the scoreboard.',
    'What are you wearing? Feel the implement in your hand just before you begin. You are watching your throw land, knowing it\'s a big one.'
  ],
  [
    'Step_6',
    'Connect emotionally:',
    'How do you want to feel? Proud? Excited? Relieved?',
    'How do you want to feel? Proud? Powerful? Explosive?',
    'How do you want to feel? Proud? Light? Successful?',
    'How do you want to feel? Proud? Strong? Resilient?',
    'How do you want to feel? Proud? Fast? Dominant?',
    'How do you want to feel? Proud? Powerful? Unleashed?'
  ],
  [
    'Step_7',
    'Go bigger:',
    'Let\'s take it up a notch. Imagine clearing a national record. What would that look like?',
    'Let\'s take it up a notch. Imagine breaking the championship record. What would that look like?',
    'Let\'s take it up a notch. Imagine winning the Olympic final. What would that look like?',
    'Let\'s take it up a notch. Imagine winning a major championship race. What would that look like?',
    'Let\'s take it up a notch. Imagine running a legendary time in a final. What would that look like?',
    'Let\'s take it up a notch. Imagine throwing a distance that wins a gold medal. What would that look like?'
  ],
  [
    'Step_8',
    'Rehearse an action:',
    'Now, mentally rehearse... your powerful run-up and the perfect plant of the pole.',
    'Now, mentally rehearse... your final two steps and the explosive takeoff from the board.',
    'Now, mentally rehearse... your curved approach and powerful upward drive at takeoff.',
    'Now, mentally rehearse... your final kick on the last lap, pulling away from the competition.',
    'Now, mentally rehearse... your explosive start from the blocks in reaction to the gun.',
    'Now, mentally rehearse... your perfect technique in the circle or on the runway, and the final, explosive release.'
  ],
  [
    'Step_9',
    'Close with clarity:',
    'Take five more deep breaths...',
    'Take five more deep breaths...',
    'Take five more deep breaths...',
    'Take five more deep breaths...',
    'Take five more deep breaths...',
    'Take five more deep breaths...'
  ]
];

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(sampleData);

// Set column widths
const colWidths = [
  { wch: 10 }, // Step_ID
  { wch: 30 }, // Template_Text
  { wch: 60 }, // Pole Vault
  { wch: 60 }, // Horizontal Jumps
  { wch: 60 }, // High Jump
  { wch: 60 }, // Distance Running
  { wch: 60 }, // Sprinting
  { wch: 60 }, // Throws
];
ws['!cols'] = colWidths;

XLSX.utils.book_append_sheet(wb, ws, 'Personalization');

// Write file
XLSX.writeFile(wb, './data/personalization/excel/sample-filled.xlsx');
console.log('✅ Created filled sample Excel file at: ./data/personalization/excel/sample-filled.xlsx');