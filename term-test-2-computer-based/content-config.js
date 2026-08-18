(function () {
  'use strict';

  // Dữ liệu vào: nội dung Term Test 2 đã được đối chiếu với 18 trang scan gốc.
  // Việc chính: mô tả đề bằng HTML có ngữ nghĩa và để lại đúng một vị trí cho mỗi ô trả lời.
  // Kết quả: học viên đọc, chọn và nhập đáp án trực tiếp trong nội dung đề, không cần ảnh nền.
  // Khi lỗi: test tự động sẽ báo câu thiếu, câu trùng hoặc nội dung vô tình chứa đáp án đúng.
  function textAnswer(number, size = '') {
    return `<span class="cbt-inline-answer ${size}" data-question-number="${number}">
      <span class="cbt-blank-number">${number}</span>
      <span data-answer-slot="${number}"></span>
    </span>`;
  }

  function selectAnswer(number, label = '') {
    return `<span class="cbt-select-answer" data-question-number="${number}">
      ${label ? `<span class="cbt-select-label">${label}</span>` : ''}
      <span class="cbt-blank-number">${number}</span>
      <span data-answer-slot="${number}"></span>
    </span>`;
  }

  function choiceQuestion(number, prompt, options) {
    return `<article class="cbt-question-card" data-question-number="${number}" data-control="radio">
      <div class="cbt-question-heading">
        <span class="cbt-question-number">${number}</span>
        <p>${prompt}</p>
      </div>
      <div class="cbt-choice-list">
        ${options.map(([value, text]) => `<label class="cbt-choice" data-choice-value="${value}">
          ${String(value).trim().toLowerCase() === String(text).trim().toLowerCase()
            ? `<span>${text}</span>`
            : `<span class="cbt-choice-letter">${value}</span><span>${text}</span>`}
        </label>`).join('')}
      </div>
      <span class="cbt-native-slot" data-answer-slot="${number}"></span>
    </article>`;
  }

  function multiChoice(numbers, prompt, options) {
    return `<article class="cbt-question-card cbt-multi-choice" data-control="multi" data-question-numbers="${numbers.join(',')}">
      <div class="cbt-question-heading">
        <span class="cbt-question-number">${numbers.join('–')}</span>
        <p>${prompt}</p>
      </div>
      <p class="cbt-multi-instruction">Tick up to TWO options. Untick an option before choosing another one.</p>
      <div class="cbt-choice-list cbt-multi-choice-list">
        ${options.map(([value, text]) => `<label class="cbt-choice" data-choice-value="${value}">
          <span class="cbt-choice-letter">${value}</span>
          <span>${text}</span>
        </label>`).join('')}
      </div>
      ${numbers.map(number => `<span class="cbt-native-slot" data-answer-slot="${number}"></span>`).join('')}
    </article>`;
  }

  const content = {
    variant: 'semantic-html',
    baseTestSlug: 'term-test-2',
    title: 'Term Test 2 · Computer-based',
    audio: {
      src: 'assets/listening/term-test-2-audio.mp3',
      label: 'Listening audio',
      durationLabel: 'Khoảng 31 phút'
    },
    listening: {
      instructions: [
        'Nhập hoặc chọn đáp án ngay trong từng câu hỏi.',
        'Dùng thanh số câu phía dưới để chuyển nhanh hoặc đánh dấu câu cần xem lại.',
        'Audio thi thật tự phát khi bạn bấm Bắt đầu thi Listening và không có nút tua.'
      ],
      sections: [
        {
          label: 'Part 1',
          range: 'Questions 1–10',
          html: `
            <header class="cbt-section-intro">
              <p class="cbt-kicker">PART 1 · QUESTIONS 1–10</p>
              <h3>Bankside Recruitment Agency</h3>
              <p>Complete the notes below.</p>
              <p class="cbt-instruction">Write <strong>ONE WORD AND/OR A NUMBER</strong> for each answer.</p>
            </header>
            <article class="cbt-notes-card">
              <div class="cbt-note-group">
                <p><span>Address of agency</span><strong>497 Eastside, Docklands</strong></p>
                <p><span>Name of agent</span><strong>Becky ${textAnswer(1)}</strong></p>
                <p><span>Phone number</span><strong>07866 510333</strong></p>
                <p><span>Best to call her in the</span><strong>${textAnswer(2)}</strong></p>
              </div>
              <section class="cbt-note-section">
                <h4>Typical jobs</h4>
                <ul>
                  <li>Clerical and admin roles, mainly in the finance industry</li>
                  <li>Must have good ${textAnswer(3)} skills</li>
                  <li>Jobs are usually for at least one ${textAnswer(4)}</li>
                  <li>Pay is usually £ ${textAnswer(5, 'is-short')} per hour</li>
                </ul>
              </section>
              <section class="cbt-note-section">
                <h4>Registration process</h4>
                <ul>
                  <li>Wear a ${textAnswer(6)} to the interview</li>
                  <li>Must bring your ${textAnswer(7)} to the interview</li>
                  <li>They will ask questions about each applicant’s ${textAnswer(8)}</li>
                </ul>
              </section>
              <section class="cbt-note-section">
                <h4>Advantages of using an agency</h4>
                <ul>
                  <li>The ${textAnswer(9)} you receive at interview will benefit you</li>
                  <li>Will get access to vacancies which are not advertised</li>
                  <li>Less ${textAnswer(10)} is involved in applying for jobs</li>
                </ul>
              </section>
            </article>
          `
        },
        {
          label: 'Part 2',
          range: 'Questions 11–20',
          html: `
            <header class="cbt-section-intro">
              <p class="cbt-kicker">PART 2 · QUESTIONS 11–20</p>
              <h3>Matthews Island Holidays</h3>
              <p class="cbt-instruction">Questions 11–14 · Choose the correct letter, <strong>A, B or C</strong>.</p>
            </header>
            <div class="cbt-question-list">
              ${choiceQuestion(11, 'According to the speaker, the company', [
                ['A', 'has been in business for longer than most of its competitors.'],
                ['B', 'arranges holidays to more destinations than its competitors.'],
                ['C', 'has more customers than its competitors.']
              ])}
              ${choiceQuestion(12, 'Where can customers meet the tour manager before travelling to the Isle of Man?', [
                ['A', 'Liverpool'], ['B', 'Heysham'], ['C', 'Luton']
              ])}
              ${choiceQuestion(13, 'How many lunches are included in the price of the holiday?', [
                ['A', 'three'], ['B', 'four'], ['C', 'five']
              ])}
              ${choiceQuestion(14, 'Customers have to pay extra for', [
                ['A', 'guaranteeing themselves a larger room.'],
                ['B', 'booking at short notice.'],
                ['C', 'transferring to another date.']
              ])}
            </div>
            <section class="cbt-subsection-heading">
              <h4>Questions 15–20</h4>
              <p>Complete the table below. Write <strong>ONE WORD AND/OR A NUMBER</strong> for each answer.</p>
            </section>
            <div class="cbt-table-wrap">
              <table class="cbt-test-table">
                <caption>Timetable for Isle of Man holiday</caption>
                <thead><tr><th>Day</th><th>Activity</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr><th>Day 1</th><td>Arrive</td><td>Introduction by manager<br>Hotel dining room has view of the ${textAnswer(15)}</td></tr>
                  <tr><th>Day 2</th><td>Tynwald Exhibition and Peel</td><td>Tynwald may have been founded in ${textAnswer(16, 'is-short')}, not 979.</td></tr>
                  <tr><th>Day 3</th><td>Trip to Snaefell</td><td>Travel along promenade in a tram; train to Laxey; train to the ${textAnswer(17)} of Snaefell</td></tr>
                  <tr><th>Day 4</th><td>Free day</td><td>Company provides a ${textAnswer(18)} for local transport and heritage sites.</td></tr>
                  <tr><th>Day 5</th><td>Take the ${textAnswer(19)} railway train from Douglas to Port Erin</td><td>Free time, then coach to Castletown – former ${textAnswer(20)} has old castle.</td></tr>
                  <tr><th>Day 6</th><td>Leave</td><td>Leave the island by ferry or plane</td></tr>
                </tbody>
              </table>
            </div>
          `
        },
        {
          label: 'Part 3',
          range: 'Questions 21–30',
          html: `
            <header class="cbt-section-intro">
              <p class="cbt-kicker">PART 3 · QUESTIONS 21–30</p>
              <h3>Birth order and personality</h3>
              <p>What did findings of previous research claim about the personality traits a child is likely to have because of their position in the family?</p>
              <p class="cbt-instruction">Questions 21–26 · Choose <strong>SIX</strong> answers from the box and write the correct letter, <strong>A–H</strong>.</p>
            </header>
            <div class="cbt-matching-layout">
              <aside class="cbt-option-bank">
                <h4>Personality traits</h4>
                <div><strong>A</strong><span>outgoing</span></div>
                <div><strong>B</strong><span>selfish</span></div>
                <div><strong>C</strong><span>independent</span></div>
                <div><strong>D</strong><span>attention-seeking</span></div>
                <div><strong>E</strong><span>introverted</span></div>
                <div><strong>F</strong><span>co-operative</span></div>
                <div><strong>G</strong><span>caring</span></div>
                <div><strong>H</strong><span>competitive</span></div>
              </aside>
              <section class="cbt-matching-questions">
                <h4>Position in family</h4>
                <div><span>the eldest child</span>${selectAnswer(21)}</div>
                <div><span>a middle child</span>${selectAnswer(22)}</div>
                <div><span>the youngest child</span>${selectAnswer(23)}</div>
                <div><span>a twin</span>${selectAnswer(24)}</div>
                <div><span>an only child</span>${selectAnswer(25)}</div>
                <div><span>a child with much older siblings</span>${selectAnswer(26)}</div>
              </section>
            </div>
            <section class="cbt-subsection-heading">
              <h4>Questions 27 and 28</h4>
              <p>Choose the correct letter, <strong>A, B or C</strong>.</p>
            </section>
            <div class="cbt-question-list">
              ${choiceQuestion(27, 'What do the speakers say about the evidence relating to birth order and academic success?', [
                ['A', 'There is conflicting evidence about whether oldest children perform best in intelligence tests.'],
                ['B', 'There is little doubt that birth order has less influence on academic achievement than socio-economic status.'],
                ['C', 'Some studies have neglected to include important factors such as family size.']
              ])}
              ${choiceQuestion(28, 'What does Ruth think is surprising about the difference in oldest children’s academic performance?', [
                ['A', 'It is mainly thanks to their roles as teachers for their younger siblings.'],
                ['B', 'The advantages they have only lead to a slightly higher level of achievement.'],
                ['C', 'The extra parental attention they receive at a young age makes little difference.']
              ])}
              ${multiChoice([29, 30], 'Which TWO experiences of sibling rivalry do the speakers agree has been valuable for them?', [
                ['A', 'learning to share'],
                ['B', 'learning to stand up for oneself'],
                ['C', 'learning to be a good loser'],
                ['D', 'learning to be tolerant'],
                ['E', 'learning to say sorry']
              ])}
            </div>
          `
        },
        {
          label: 'Part 4',
          range: 'Questions 31–40',
          html: `
            <header class="cbt-section-intro">
              <p class="cbt-kicker">PART 4 · QUESTIONS 31–40</p>
              <h3>The Eucalyptus Tree in Australia</h3>
              <p>Complete the notes below.</p>
              <p class="cbt-instruction">Write <strong>ONE WORD ONLY</strong> for each answer.</p>
            </header>
            <article class="cbt-notes-card">
              <section class="cbt-note-section">
                <h4>Importance</h4>
                <ul>
                  <li>it provides ${textAnswer(31)} and food for a wide range of species</li>
                  <li>its leaves provide ${textAnswer(32)} which is used to make a disinfectant</li>
                </ul>
              </section>
              <section class="cbt-note-section">
                <h4>Reasons for present decline in number</h4>
                <h5>A · Diseases</h5>
                <p class="cbt-note-label">(i) ‘Mundulla Yellows’</p>
                <ul>
                  <li>Cause – lime used for making ${textAnswer(33)} was absorbed</li>
                  <li>trees were unable to take in necessary iron through their roots</li>
                </ul>
                <p class="cbt-note-label">(ii) ‘Bell-miner Associated Die-back’</p>
                <ul>
                  <li>Cause – ${textAnswer(34)} feed on eucalyptus leaves</li>
                  <li>they secrete a substance containing sugar</li>
                  <li>bell-miner birds are attracted by this and keep away other species</li>
                </ul>
                <h5>B · Bushfires</h5>
                <p class="cbt-note-label">William Jackson’s theory:</p>
                <ul>
                  <li>high-frequency bushfires have impact on vegetation, resulting in the growth of ${textAnswer(35)}</li>
                  <li>mid-frequency bushfires result in the growth of eucalyptus forests, because they:
                    <ul>
                      <li>make more ${textAnswer(36)} available to the trees</li>
                      <li>maintain the quality of the ${textAnswer(37)}</li>
                    </ul>
                  </li>
                  <li>low-frequency bushfires result in the growth of ‘${textAnswer(38)} rainforest’, which is:
                    <ul>
                      <li>a ${textAnswer(39)} ecosystem</li>
                      <li>an ideal environment for the ${textAnswer(40)} of the bell-miner</li>
                    </ul>
                  </li>
                </ul>
              </section>
            </article>
          `
        }
      ]
    },
    reading: {
      instructions: [
        'Bài đọc và câu hỏi đều là HTML; bạn có thể bôi chọn chữ và cuộn từng khung riêng.',
        'Nhập hoặc chọn đáp án ngay trong từng câu hỏi ở khung bên phải.',
        'Đồng hồ 60 phút bắt đầu ngay khi mở Reading; hết giờ hệ thống tự nộp bài.',
        'Dùng thanh số câu phía dưới để chuyển nhanh hoặc đánh dấu câu cần xem lại.'
      ],
      sections: [
        {
          label: 'Passage 1',
          range: 'Questions 1–13',
          title: 'Nutmeg – a valuable spice',
          passageHtml: `
            <p>The nutmeg tree, <em>Myristica fragrans</em>, is a large evergreen tree native to Southeast Asia. Until the late 18th century, it only grew in one place in the world: a small group of islands in the Banda Sea, part of the Moluccas – or Spice Islands – in northeastern Indonesia. The tree is thickly branched with dense foliage of tough, dark green oval leaves, and produces small, yellow, bell-shaped flowers and pale yellow pear-shaped fruits. The fruit is encased in a fleshy husk. When the fruit is ripe, this husk splits into two halves along a ridge running the length of the fruit. Inside is a purple-brown shiny seed, 2–3 cm long by about 2 cm across, surrounded by a lacy red or crimson covering called an ‘aril’. These are the sources of the two spices nutmeg and mace, the former being produced from the dried seed and the latter from the aril.</p>
            <p>Nutmeg was a highly prized and costly ingredient in European cuisine in the Middle Ages, and was used as a flavouring, medicinal, and preservative agent. Throughout this period, the Arabs were the exclusive importers of the spice to Europe. They sold nutmeg for high prices to merchants based in Venice, but they never revealed the exact location of the source of this extremely valuable commodity. The Arab-Venetian dominance of the trade finally ended in 1512, when the Portuguese reached the Banda Islands and began exploiting its precious resources.</p>
            <p>Always in danger of competition from neighbouring Spain, the Portuguese began subcontracting their spice distribution to Dutch traders. Profits began to flow into the Netherlands, and the Dutch commercial fleet swiftly grew into one of the largest in the world. The Dutch quietly gained control of most of the shipping and trading of spices in Northern Europe. Then, in 1580, Portugal fell under Spanish rule, and by the end of the 16th century the Dutch found themselves locked out of the market. As prices for pepper, nutmeg, and other spices soared across Europe, they decided to fight back.</p>
            <p>In 1602, Dutch merchants founded the VOC, a trading corporation better known as the Dutch East India Company. By 1617, the VOC was the richest commercial operation in the world. The company had 50,000 employees worldwide, with a private army of 30,000 men and a fleet of 200 ships. At the same time, thousands of people across Europe were dying of the plague, a highly contagious and deadly disease. Doctors were desperate for a way to stop the spread of this disease, and they decided nutmeg held the cure. Everybody wanted nutmeg, and many were willing to spare no expense to have it. Nutmeg bought for a few pennies in Indonesia could be sold for 68,000 times its original cost on the streets of London. The only problem was the short supply. And that’s where the Dutch found their opportunity.</p>
            <p>The Banda Islands were ruled by local sultans who insisted on maintaining a neutral trading policy towards foreign powers. This allowed them to avoid the presence of Portuguese or Spanish troops on their soil, but it also left them unprotected from other invaders. In 1621, the Dutch arrived and took over. Once securely in control of the Bandas, the Dutch went to work protecting their new investment. They concentrated all nutmeg production into a few easily guarded areas, uprooting and destroying any trees outside the plantation zones. Anyone caught growing a nutmeg seedling or carrying seeds without the proper authority was severely punished. In addition, all exported nutmeg was covered with lime to make sure there was no chance a fertile seed which could be grown elsewhere would leave the islands. There was only one obstacle to Dutch domination. One of the Banda Islands, a sliver of land called Run, only 3 km long by less than 1 km wide, was under the control of the British. After decades of fighting for control of this tiny island, the Dutch and British arrived at a compromise settlement, the Treaty of Breda, in 1667. Intent on securing their hold over every nutmeg-producing island, the Dutch offered a trade: if the British would give them the island of Run, they would in turn give Britain a distant and much less valuable island in North America. The British agreed. That other island was Manhattan, which is how New Amsterdam became New York. The Dutch now had a monopoly over the nutmeg trade which would last for another century.</p>
            <p>Then, in 1770, a Frenchman named Pierre Poivre successfully smuggled nutmeg plants to safety in Mauritius, an island off the coast of Africa. Some of these were later exported to the Caribbean where they thrived, especially on the island of Grenada. Next, in 1778, a volcanic eruption in the Banda region caused a tsunami that wiped out half the nutmeg groves. Finally, in 1809, the British returned to Indonesia and seized the Banda Islands by force. They returned the islands to the Dutch in 1817, but not before transplanting hundreds of nutmeg seedlings to plantations in several locations across southern Asia. The Dutch nutmeg monopoly was over.</p>
            <p>Today, nutmeg is grown in Indonesia, the Caribbean, India, Malaysia, Papua New Guinea and Sri Lanka, and world nutmeg production is estimated to average between 10,000 and 12,000 tonnes per year.</p>
          `,
          questionsHtml: `
            <header class="cbt-section-intro"><p class="cbt-kicker">QUESTIONS 1–13</p><h3>Reading Passage 1</h3></header>
            <section class="cbt-subsection-heading"><h4>Questions 1–4</h4><p>Complete the notes below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p></section>
            <article class="cbt-notes-card">
              <h4>The nutmeg tree and fruit</h4>
              <ul>
                <li>the leaves of the tree are ${textAnswer(1)} in shape</li>
                <li>the ${textAnswer(2)} surrounds the fruit and breaks open when the fruit is ripe</li>
                <li>the ${textAnswer(3)} is used to produce the spice nutmeg</li>
                <li>the covering known as the aril is used to produce ${textAnswer(4)}</li>
                <li>the tree has yellow flowers and fruit</li>
              </ul>
            </article>
            <section class="cbt-subsection-heading"><h4>Questions 5–7</h4><p>Do the following statements agree with the information given in Reading Passage 1?</p></section>
            <div class="cbt-legend-box"><strong>TRUE</strong><span>if the statement agrees with the information</span><strong>FALSE</strong><span>if the statement contradicts the information</span><strong>NOT GIVEN</strong><span>if there is no information on this</span></div>
            <div class="cbt-question-list">
              ${choiceQuestion(5, 'In the Middle Ages, most Europeans knew where nutmeg was grown.', [['TRUE', 'True'], ['FALSE', 'False'], ['NOT GIVEN', 'Not given']])}
              ${choiceQuestion(6, 'The VOC was the world’s first major trading company.', [['TRUE', 'True'], ['FALSE', 'False'], ['NOT GIVEN', 'Not given']])}
              ${choiceQuestion(7, 'Following the Treaty of Breda, the Dutch had control of all the islands where nutmeg grew.', [['TRUE', 'True'], ['FALSE', 'False'], ['NOT GIVEN', 'Not given']])}
            </div>
            <section class="cbt-subsection-heading"><h4>Questions 8–13</h4><p>Complete the table below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p></section>
            <div class="cbt-table-wrap"><table class="cbt-test-table cbt-history-table"><tbody>
              <tr><th>Middle Ages</th><td>Nutmeg was brought to Europe by the ${textAnswer(8)}</td></tr>
              <tr><th>16th century</th><td>European nations took control of the nutmeg trade</td></tr>
              <tr><th>17th century</th><td>Demand for nutmeg grew, as it was believed to be effective against the disease known as the ${textAnswer(9)}<hr>The Dutch<ul><li>took control of the Banda Islands</li><li>restricted nutmeg production to a few areas</li><li>put ${textAnswer(10)} on nutmeg to avoid it being cultivated outside the islands</li><li>finally obtained the island of ${textAnswer(11)} from the British</li></ul></td></tr>
              <tr><th>Late 18th century</th><td>1770 – nutmeg plants were secretly taken to ${textAnswer(12)}<br><br>1778 – half the Banda Islands’ nutmeg plantations were destroyed by a ${textAnswer(13)}</td></tr>
            </tbody></table></div>
          `
        },
        {
          label: 'Passage 2',
          range: 'Questions 14–26',
          title: 'Driverless cars',
          passageHtml: `
            <section class="cbt-lettered-paragraph"><span>A</span><div><p>The automotive sector is well used to adapting to automation in manufacturing. The implementation of robotic car manufacture from the 1970s onwards led to significant cost savings and improvements in the reliability and flexibility of vehicle mass production. A new challenge to vehicle production is now on the horizon and, again, it comes from automation. However, this time it is not to do with the manufacturing process, but with the vehicles themselves.</p><p>Research projects on vehicle automation are not new. Vehicles with limited self-driving capabilities have been around for more than 50 years, resulting in significant contributions towards driver assistance systems. But since Google announced in 2010 that it had been trialling self-driving cars on the streets of California, progress in this field has quickly gathered pace.</p></div></section>
            <section class="cbt-lettered-paragraph"><span>B</span><div><p>There are many reasons why technology is advancing so fast. One frequently cited motive is safety; indeed, research at the UK’s Transport Research Laboratory has demonstrated that more than 90 percent of road collisions involve human error as a contributory factor, and it is the primary cause in the vast majority. Automation may help to reduce the incidence of this.</p><p>Another aim is to free the time people spend driving for other purposes. If the vehicle can do some or all of the driving, it may be possible to be productive, to socialise or simply to relax while automation systems have responsibility for safe control of the vehicle. If the vehicle can do the driving, those who are challenged by existing mobility models – such as older or disabled travellers – may be able to enjoy significantly greater travel autonomy.</p></div></section>
            <section class="cbt-lettered-paragraph"><span>C</span><div><p>Beyond these direct benefits, we can consider the wider implications for transport and society, and how manufacturing processes might need to respond as a result. At present, the average car spends more than 90 percent of its life parked. Automation means that initiatives for car-sharing become much more viable, particularly in urban areas with significant travel demand. If a significant proportion of the population choose to use shared automated vehicles, mobility demand can be met by far fewer vehicles.</p></div></section>
            <section class="cbt-lettered-paragraph"><span>D</span><div><p>The Massachusetts Institute of Technology investigated automated mobility in Singapore, finding that fewer than 30 percent of the vehicles currently used would be required if fully automated car sharing could be implemented. If this is the case, it might mean that we need to manufacture far fewer vehicles to meet demand.</p><p>However, the number of trips being taken would probably increase, partly because empty vehicles would have to be moved from one customer to the next.</p><p>Modelling work by the University of Michigan Transportation Research Institute suggests automated vehicles might reduce vehicle ownership by 43 percent, but that vehicles’ average annual mileage would double as a result. As a consequence, each vehicle would be used more intensively, and might need replacing sooner. This faster rate of turnover may mean that vehicle production will not necessarily decrease.</p></div></section>
            <section class="cbt-lettered-paragraph"><span>E</span><div><p>Automation may prompt other changes in vehicle manufacture. If we move to a model where consumers are tending not to own a single vehicle but to purchase access to a range of vehicles through a mobility provider, drivers will have the freedom to select one that best suits their needs for a particular journey, rather than making a compromise across all their requirements.</p><p>Since, for most of the time, most of the seats in most cars are unoccupied, this may boost production of a smaller, more efficient range of vehicles that suit the needs of individuals. Specialised vehicles may then be available for exceptional journeys, such as going on a family camping trip or helping a son or daughter move to university.</p></div></section>
            <section class="cbt-lettered-paragraph"><span>F</span><div><p>There are a number of hurdles to overcome in delivering automated vehicles to our roads. These include the technical difficulties in ensuring that the vehicle works reliably in the infinite range of traffic, weather and road situations it might encounter; the regulatory challenges in understanding how liability and enforcement might change when drivers are no longer essential for vehicle operation; and the societal changes that may be required for communities to trust and accept automated vehicles as being a valuable part of the mobility landscape.</p></div></section>
            <section class="cbt-lettered-paragraph"><span>G</span><div><p>It’s clear that there are many challenges that need to be addressed but, through robust and targeted research, these can most probably be conquered within the next 10 years. Mobility will change in such potentially significant ways and in association with so many other technological developments, such as telepresence and virtual reality, that it is hard to make concrete predictions about the future. However, one thing is certain: change is coming, and the need to be flexible in response to this will be vital for those involved in manufacturing the vehicles that will deliver future mobility.</p></div></section>
          `,
          questionsHtml: `
            <header class="cbt-section-intro"><p class="cbt-kicker">QUESTIONS 14–26</p><h3>Reading Passage 2</h3></header>
            <section class="cbt-subsection-heading"><h4>Questions 14–18</h4><p>Reading Passage 2 has seven sections, <strong>A–G</strong>. Which section contains the following information?</p></section>
            <div class="cbt-matching-questions cbt-full-width">
              <div><span>reference to the amount of time when a car is not in use</span>${selectAnswer(14)}</div>
              <div><span>mention of several advantages of driverless vehicles for individual road-users</span>${selectAnswer(15)}</div>
              <div><span>reference to the opportunity of choosing the most appropriate vehicle for each trip</span>${selectAnswer(16)}</div>
              <div><span>an estimate of how long it will take to overcome a number of problems</span>${selectAnswer(17)}</div>
              <div><span>a suggestion that the use of driverless cars may have no effect on the number of vehicles manufactured</span>${selectAnswer(18)}</div>
            </div>
            <section class="cbt-subsection-heading"><h4>Questions 19–22</h4><p>Complete the summary below. Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage for each answer.</p></section>
            <article class="cbt-summary-card"><h4>The impact of driverless cars</h4><p>Figures from the Transport Research Laboratory indicate that most motor accidents are partly due to ${textAnswer(19)}, so the introduction of driverless vehicles will result in greater safety. In addition to the direct benefits of automation, it may bring other advantages. For example, schemes for ${textAnswer(20)} will be more workable, especially in towns and cities, resulting in fewer cars on the road.</p><p>According to the University of Michigan Transportation Research Institute, there could be a 43 percent drop in ${textAnswer(21)} of cars. However, this would mean that the yearly ${textAnswer(22)} of each car would, on average, be twice as high as it currently is. This would lead to a higher turnover of vehicles, and therefore no reduction in automotive manufacturing.</p></article>
            <section class="cbt-subsection-heading"><h4>Questions 23 and 24</h4><p>Choose <strong>TWO</strong> letters, <strong>A–E</strong>.</p></section>
            ${multiChoice([23, 24], 'Which TWO benefits of automated vehicles does the writer mention?', [
              ['A', 'Car travellers could enjoy considerable cost savings.'],
              ['B', 'It would be easier to find parking spaces in urban areas.'],
              ['C', 'Travellers could spend journeys doing something other than driving.'],
              ['D', 'People who find driving physically difficult could travel independently.'],
              ['E', 'A reduction in the number of cars would mean a reduction in pollution.']
            ])}
            <section class="cbt-subsection-heading"><h4>Questions 25 and 26</h4><p>Choose <strong>TWO</strong> letters, <strong>A–E</strong>.</p></section>
            ${multiChoice([25, 26], 'Which TWO challenges to automated vehicle development does the writer mention?', [
              ['A', 'making sure the general public has confidence in automated vehicles'],
              ['B', 'managing the pace of transition from conventional to automated vehicles'],
              ['C', 'deciding how to compensate professional drivers who become redundant'],
              ['D', 'setting up the infrastructure to make roads suitable for automated vehicles'],
              ['E', 'getting automated vehicles to adapt to various different driving conditions']
            ])}
          `
        },
        {
          label: 'Passage 3',
          range: 'Questions 27–40',
          title: 'What is exploration?',
          passageHtml: `
            <p>We are all explorers. Our desire to discover, and then share that new-found knowledge, is part of what makes us human – indeed, this has played an important part in our success as a species. Long before the first caveman slumped down beside the fire and grunted news that there were plenty of wildebeest over yonder, our ancestors had learnt the value of sending out scouts to investigate the unknown. This questing nature of ours undoubtedly helped our species spread around the globe, just as it nowadays no doubt helps the last nomadic Penan maintain their existence in the depleted forests of Borneo, and a visitor negotiate the subways of New York.</p>
            <p>Over the years, we’ve come to think of explorers as a peculiar breed – different from the rest of us, different from those of us who are merely ‘well travelled’, even; and perhaps there is a type of person more suited to seeking out the new, a type of caveman more inclined to risk venturing out. That, however, doesn’t take away from the fact that we all have this enquiring instinct, even today; and that in all sorts of professions – whether artist, marine biologist or astronomer – borders of the unknown are being tested each day.</p>
            <p>Thomas Hardy set some of his novels in Egdon Heath, a fictional area of uncultivated land, and used the landscape to suggest the desires and fears of his characters. He is delving into matters we all recognise because they are common to humanity. This is surely an act of exploration, and into a world as remote as the author chooses. Explorer and travel writer Peter Fleming talks of the moment when the explorer returns to the existence he has left behind with his loved ones. The traveller ‘who has for weeks or months seen himself only as a puny and irrelevant alien crawling laboriously over a country in which he has no roots and no background, suddenly encounters his other self, a relatively solid figure, with a place in the minds of certain people’.</p>
            <p>In this book about the exploration of the earth’s surface, I have confined myself to those whose travels were real and who also aimed at more than personal discovery. But that still left me with another problem: the word ‘explorer’ has become associated with a past era. We think back to a golden age, as if exploration peaked somehow in the 19th century – as if the process of discovery is now on the decline, though the truth is that we have named only one and a half million of this planet’s species, and there may be more than 10 million – and that’s not including bacteria. We have studied only 5 per cent of the species we know. We have scarcely mapped the ocean floors, and know even less about ourselves; we fully understand the workings of only 10 per cent of our brains.</p>
            <p>Here is how some of today’s ‘explorers’ define the word. Ran Fiennes, dubbed the ‘greatest living explorer’, said, ‘An explorer is someone who has done something that no human has done before – and also done something scientifically useful.’ Chris Bonington, a leading mountaineer, felt exploration was to be found in the act of physically touching the unknown: ‘You have to have gone somewhere new.’ Then Robin Hanbury-Tenison, a campaigner on behalf of remote so-called ‘tribal’ peoples, said, ‘A traveller simply records information about some far-off world, and reports back; but an explorer changes the world.’ Wilfred Thesiger, who crossed Arabia’s Empty Quarter in 1946, and belongs to an era of unmechanised travel now lost to the rest of us, told me, ‘If I’d gone across by camel when I could have gone by car, it would have been a stunt.’ To him, exploration meant bringing back information from a remote place regardless of any great self-discovery.</p>
            <p>Each definition is slightly different – and tends to reflect the field of endeavour of each pioneer. It was the same whoever I asked: the prominent historian would say exploration was a thing of the past, the cutting-edge scientist would say it was of the present. And so on. They each set their own particular criteria; the common factor in their approach being that they all had, unlike many of us who simply enjoy travel or discovering new things, both a very definite objective from the outset and also a desire to record their findings.</p>
            <p>I’d best declare my own bias. As a writer, I’m interested in the exploration of ideas. I’ve done a great many expeditions and each one was unique. I’ve lived for months alone with isolated groups of people all around the world, even two ‘uncontacted tribes’. But none of these things is of the slightest interest to anyone unless, through my books, I’ve found a new slant, explored a new idea. Why? Because the world has moved on. The time has long passed for the great continental voyages – another walk to the poles, another crossing of the Empty Quarter. We know how the land surface of our planet lies; exploration of it is now down to the details – the habits of microbes, say, or the grazing behaviour of buffalo. Aside from the deep sea and deep underground, it’s the era of specialists. However, this is to disregard the role the human mind has in conveying remote places; and this is what interests me: how a fresh interpretation, even of a well-travelled route, can give its readers new insights.</p>
          `,
          questionsHtml: `
            <header class="cbt-section-intro"><p class="cbt-kicker">QUESTIONS 27–40</p><h3>Reading Passage 3</h3></header>
            <section class="cbt-subsection-heading"><h4>Questions 27–32</h4><p>Choose the correct letter, <strong>A, B, C or D</strong>.</p></section>
            <div class="cbt-question-list">
              ${choiceQuestion(27, 'The writer refers to visitors to New York to illustrate the point that', [['A', 'exploration is an intrinsic element of being human.'], ['B', 'most people are enthusiastic about exploring.'], ['C', 'exploration can lead to surprising results.'], ['D', 'most people find exploration daunting.']])}
              ${choiceQuestion(28, 'According to the second paragraph, what is the writer’s view of explorers?', [['A', 'Their discoveries have brought both benefits and disadvantages.'], ['B', 'Their main value is in teaching others.'], ['C', 'They act on an urge that is common to everyone.'], ['D', 'They tend to be more attracted to certain professions than to others.']])}
              ${choiceQuestion(29, 'The writer refers to a description of Egdon Heath to suggest that', [['A', 'Hardy was writing about his own experience of exploration.'], ['B', 'Hardy was mistaken about the nature of exploration.'], ['C', 'Hardy’s aim was to investigate people’s emotional states.'], ['D', 'Hardy’s aim was to show the attraction of isolation.']])}
              ${choiceQuestion(30, 'In the fourth paragraph, the writer refers to ‘a golden age’ to suggest that', [['A', 'the amount of useful information produced by exploration has decreased.'], ['B', 'fewer people are interested in exploring than in the 19th century.'], ['C', 'recent developments have made exploration less exciting.'], ['D', 'we are wrong to think that exploration is no longer necessary.']])}
              ${choiceQuestion(31, 'In the sixth paragraph, when discussing the definition of exploration, the writer argues that', [['A', 'people tend to relate exploration to their own professional interests.'], ['B', 'certain people are likely to misunderstand the nature of exploration.'], ['C', 'the generally accepted definition has changed over time.'], ['D', 'historians and scientists have more valid definitions than the general public.']])}
              ${choiceQuestion(32, 'In the last paragraph, the writer explains that he is interested in', [['A', 'how someone’s personality is reflected in their choice of places to visit.'], ['B', 'the human ability to cast new light on places that may be familiar.'], ['C', 'how travel writing has evolved to meet changing demands.'], ['D', 'the feelings that writers develop about the places that they explore.']])}
            </div>
            <section class="cbt-subsection-heading"><h4>Questions 33–37</h4><p>Match each statement with the correct explorer, <strong>A–E</strong>. You may use any letter more than once.</p></section>
            <aside class="cbt-option-bank cbt-horizontal-bank"><div><strong>A</strong><span>Peter Fleming</span></div><div><strong>B</strong><span>Ran Fiennes</span></div><div><strong>C</strong><span>Chris Bonington</span></div><div><strong>D</strong><span>Robin Hanbury-Tenison</span></div><div><strong>E</strong><span>Wilfred Thesiger</span></div></aside>
            <div class="cbt-matching-questions cbt-full-width">
              <div><span>He referred to the relevance of the form of transport used.</span>${selectAnswer(33)}</div>
              <div><span>He described feelings on coming back home after a long journey.</span>${selectAnswer(34)}</div>
              <div><span>He worked for the benefit of specific groups of people.</span>${selectAnswer(35)}</div>
              <div><span>He did not consider learning about oneself an essential part of exploration.</span>${selectAnswer(36)}</div>
              <div><span>He defined exploration as being both unique and of value to others.</span>${selectAnswer(37)}</div>
            </div>
            <section class="cbt-subsection-heading"><h4>Questions 38–40</h4><p>Complete the summary below. Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage for each answer.</p></section>
            <article class="cbt-summary-card"><h4>The writer’s own bias</h4><p>The writer has experience of a large number of ${textAnswer(38)}, and was the first stranger that certain previously ${textAnswer(39)} people had encountered. He believes there is no need for further exploration of Earth’s ${textAnswer(40)}, except to answer specific questions such as how buffalo eat.</p></article>
          `
        }
      ]
    }
  };

  window.TERM_TEST_CONTENT = Object.freeze(content);
}());
