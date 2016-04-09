# Lily - Your personal assistant

(Below assumes you know how to create AWS Lambda and Alexa Skill)

## Alexa, ask Lily where my bus to [_destination_] is
### How to use
1. Set your OneBusAway API key in __Config.ts__.
2. Add your own trip in __index.ts__.
3. Execute the line below to get the utterances.
```
node index.js schema
```