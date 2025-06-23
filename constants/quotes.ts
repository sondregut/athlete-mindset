export const motivationalQuotes = [
  "The only person you should try to be better than is the person you were yesterday.",
  "Mental toughness is to physical as four is to one.",
  "Champions aren't made in the gyms. Champions are made from something they have deep inside them — a desire, a dream, a vision.",
  "The difference between the impossible and the possible lies in a person's determination.",
  "Success isn't always about greatness. It's about consistency. Consistent hard work leads to success. Greatness will come.",
  "The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it, as long as you really believe 100 percent.",
  "You have to expect things of yourself before you can do them.",
  "It's not about perfect. It's about effort. And when you bring that effort every single day, that's where transformation happens.",
  "The only way to prove that you're a good sport is to lose.",
  "What you do today can improve all your tomorrows.",
  "The more difficult the victory, the greater the happiness in winning.",
  "You miss 100% of the shots you don't take.",
  "It's not whether you get knocked down; it's whether you get up.",
  "The harder you work, the luckier you get.",
  "Talent wins games, but teamwork and intelligence win championships."
];

export const getRandomQuote = (): string => {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[randomIndex];
};