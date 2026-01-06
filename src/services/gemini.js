import { GoogleGenerativeAI } from '@google/generative-ai';

// Fallback mock service
async function getRelatedWordsMock(word, count) {
  await new Promise(resolve => setTimeout(resolve, 800));
  const mocks = [
    { word: 'Idea', translation: '想法' },
    { word: 'Concept', translation: '概念' },
    { word: 'Design', translation: '设计' },
    { word: 'Innovation', translation: '创新' },
    { word: 'Art', translation: '艺术' },
    { word: 'Future', translation: '未来' },
    { word: 'Chaos', translation: '混沌' },
    { word: 'Order', translation: '秩序' },
  ];
  return mocks.sort(() => 0.5 - Math.random()).slice(0, count);
}

// Helper to construct prompt with context
const createPrompt = (word, count, context, themes = [], strictMode = false) => {
  let contextStr = "";
  if (context && context.length > 0) {
    contextStr += `\n背景上下文关键词：[${context.join(', ')}]\n请确保生成的联想词不仅与 '${word}' 相关，最好也能与背景关键词产生某种联系或桥梁作用。`;
  }
  
  if (themes && themes.length > 0) {
    if (strictMode) {
      contextStr += `\n头脑风暴主题 (Brainstorming Themes)：[${themes.join(', ')}]`;
      contextStr += `\n‼ 重要限制：你必须严格围绕上述“头脑风暴主题”进行发散。生成的联想词必须体现这些主题的核心概念，不得偏离主题。`;
    } 
  }

  return `请生成 ${count} 个与词语 '${word}' 强相关的发散性联想词。${contextStr}
  要求：
  1. 关联性强，但具有一定的发散性${themes && themes.length > 0 && strictMode ? '，且严格符合主题' : ''}。
  2. 必须返回标准的 JSON 数组格式。
  3. 每个对象包含：
     - "word": 中文单词（简短）。
     - "translation": 对应的英文翻译。
  示例：[{"word": "天空", "translation": "Sky"}, {"word": "蓝色", "translation": "Blue"}]
  请只返回 JSON 数据，不要包含 markdown 格式。`;
};

async function callGemini(apiKey, word, count, context, themes, strictMode) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = createPrompt(word, count, context, themes, strictMode);

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanText);
}

async function callDeepSeek(apiKey, word, count, context, themes, strictMode) {
  const prompt = createPrompt(word, count, context, themes, strictMode);

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是一个专业的创意头脑风暴助手。请严格按照要求输出 JSON 格式。" },
        { role: "user", content: prompt }
      ],
      stream: false
    })
  });

  if (!response.ok) {
     throw new Error(`DeepSeek API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const cleanText = content.replace(/```json/g, '').replace(/```/g, '').trim();
  
  return JSON.parse(cleanText);
}

async function callOpenAICompatible(baseUrl, apiKey, modelName, word, count, context, themes, strictMode) {
  let url = baseUrl;
  if (!url.endsWith('/chat/completions')) {
     if (url.endsWith('/')) url += 'chat/completions';
     else url += '/chat/completions';
  }

  const prompt = createPrompt(word, count, context, themes, strictMode);

  const headers = {
    "Content-Type": "application/json"
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: "你是一个专业的创意头脑风暴助手。请严格按照要求输出 JSON 格式。" },
        { role: "user", content: prompt }
      ],
      stream: false,
      temperature: 0.7 
    })
  });

  if (!response.ok) {
     throw new Error(`Custom API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const cleanText = content.replace(/```json/g, '').replace(/```/g, '').trim();
  
  return JSON.parse(cleanText);
}

export async function getRelatedWords(word, count = 6, context = [], themes = [], strictMode = false) {
  const provider = localStorage.getItem('llm_provider') || 'gemini';
  
  try {
    if (provider === 'gemini') {
      const apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) throw new Error("Missing Gemini Key");
      return await callGemini(apiKey, word, count, context, themes, strictMode);
    } 
    else if (provider === 'deepseek') {
      const apiKey = localStorage.getItem('deepseek_api_key');
      if (!apiKey) throw new Error("Missing DeepSeek Key");
      return await callDeepSeek(apiKey, word, count, context, themes, strictMode);
    }
    else if (provider === 'local') {
      const baseUrl = localStorage.getItem('local_base_url') || 'http://localhost:11434/v1';
      const modelName = localStorage.getItem('local_model_name') || 'qwen2.5';
      const apiKey = localStorage.getItem('local_api_key') || ''; // Optional
      return await callOpenAICompatible(baseUrl, apiKey, modelName, word, count, context, themes, strictMode);
    }
  } catch (error) {
    console.error(`${provider} API Error:`, error);
    
    // If it's a configuration error (Missing Key), re-throw it so UI can show a warning.
    if (error.message && error.message.includes('Missing') && error.message.includes('Key')) {
      throw error;
    }

    // Fallback to mock
    return getRelatedWordsMock(word, count);
  }
}
