import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to construct prompt with context
const createPrompt = (word, count, context, themes = [], strictMode = false, language = '中文', mode = 'tree', customPrompt = '', documentContent = '') => {
  let contextStr = "";
  if (context && context.length > 0) {
    contextStr += `\n背景上下文关键词：[${context.join(', ')}]\n请确保生成的联想词不仅与 '${word}' 相关，最好也能与背景关键词产生某种联系或桥梁作用。`;
  }
  
  if (themes && themes.length > 0 && strictMode) {
    contextStr += `\n头脑风暴主题 (Brainstorming Themes)：[${themes.join(', ')}]`;
    contextStr += `\n‼ 重要限制：你必须严格围绕上述"头脑风暴主题"进行发散。生成的联想词必须体现这些主题的核心概念，不得偏离主题。`;
  }

  // Base instruction based on mode
  let instruction = "";
  switch (mode) {
    case 'custom':
      // User defined prompt. We assume user uses {0} for word and {1} for count.
      if (customPrompt) {
        return `请生成 ${count} 个与词语 '${word}' 相关的联想词。${contextStr}
        要求：
        1. 必须返回标准的 JSON 数组格式。
        2. 每个对象只包含一个字段："word"。
        示例：[{"word": "示例1"}, {"word": "示例2"}]
        请只返回 JSON 数据，不要包含 markdown 格式。`;
      }
      instruction = `请生成 ${count} 个与词语 '${word}' 相关的联想词。`; // Fallback
      break;
    case 'creative': // 创意联想
      instruction = `请生成 ${count} 个与词语 '${word}' 相关的创意联想词或类比词。侧重于隐喻、类比、跨界联想，不仅是字面相关，更是意象上的通感或跳跃。`;
      break;
    case 'related': // 默认联想
      instruction = `请生成 ${count} 个与词语 '${word}' 的近义词、相关词或强关联词。侧重于词语本身的语义相关性和常用搭配。`;
      break;
    case 'deep': // 深度联想
      instruction = `请生成 ${count} 个与词语 '${word}' 相关的深度联想词。侧重于底层逻辑、哲学含义、核心本质、第一性原理或递归拆解。`;
      break;
    case 'learning': // 学习联想
      instruction = `请生成 ${count} 个与词语 '${word}' 相关的学习拓展词（如相关的专业术语、考点、衍生词汇）。侧重于教育、记忆、知识点关联。`;
      break;
    case 'document': // 文档内容联想
      if (documentContent) {
        // Truncate document content if too long to avoid token limits (basic safeguard)
        const safeContent = documentContent.slice(0, 5000); 
        instruction = `基于以下文档内容片段：
        """${safeContent}"""
        
        请生成 ${count} 个与词语 '${word}' 相关的联想词。必须紧密结合文档内容。`;
      } else {
        instruction = `请生成 ${count} 个与词语 '${word}' 相关的联想词。`; 
      }
      break;
    case 'tree': // 父子联想
      instruction = `请生成 ${count} 个与词语 '${word}' 为子关系的词语。`;
      break;
    default:
      instruction = `请生成 ${count} 个与词语 '${word}' 强相关的发散性联想词。`;
      break;
  }

  return `${instruction}${contextStr}
  要求：
  1. 关联性强，唯一，${mode === 'creative' ? '富有创意' : '符合逻辑'}${themes && themes.length > 0 && strictMode ? '，且严格符合主题' : ''}。
  2. 生成的词语必须使用 ${language} 语言。
  3. 必须返回标准的 JSON 数组格式。
  4. 每个对象只包含一个字段：
     - "word": ${language}单词或短语（简短）。
  示例：[{"word": "天空"}, {"word": "蓝色"}]
  请只返回 JSON 数据，不要包含 markdown 格式。`;
};

async function callGemini(apiKey, word, count, context, themes, strictMode, language, mode, customPrompt, documentContent) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = createPrompt(word, count, context, themes, strictMode, language, mode, customPrompt, documentContent);

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanText);
}

async function callDeepSeek(apiKey, word, count, context, themes, strictMode, language, mode, customPrompt, documentContent) {
  const prompt = createPrompt(word, count, context, themes, strictMode, language, mode, customPrompt, documentContent);

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

async function callOpenAICompatible(baseUrl, apiKey, modelName, word, count, context, themes, strictMode, language, mode, customPrompt, documentContent) {
  let url = baseUrl;
  if (!url.endsWith('/chat/completions')) {
     if (url.endsWith('/')) url += 'chat/completions';
     else url += '/chat/completions';
  }

  const prompt = createPrompt(word, count, context, themes, strictMode, language, mode, customPrompt, documentContent);

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

export async function getRelatedWords(word, count = 6, context = [], themes = [], strictMode = false, language = '中文', mode = 'tree', customPrompt = '', documentContent = '') {
  const provider = localStorage.getItem('llm_provider') || 'gemini';
  
  try {
    if (provider === 'gemini') {
      const apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) throw new Error("Missing Gemini Key");
      return await callGemini(apiKey, word, count, context, themes, strictMode, language, mode, customPrompt, documentContent);
    } 
    else if (provider === 'deepseek') {
      const apiKey = localStorage.getItem('deepseek_api_key');
      if (!apiKey) throw new Error("Missing DeepSeek Key");
      return await callDeepSeek(apiKey, word, count, context, themes, strictMode, language, mode, customPrompt, documentContent);
    }
    else if (provider === 'local') {
      const baseUrl = localStorage.getItem('local_base_url') || 'http://localhost:11434/v1';
      const modelName = localStorage.getItem('local_model_name') || 'qwen2.5';
      const apiKey = localStorage.getItem('local_api_key') || ''; // Optional
      return await callOpenAICompatible(baseUrl, apiKey, modelName, word, count, context, themes, strictMode, language, mode, customPrompt, documentContent);
    }
    else if (provider === 'kimi') {
      const apiKey = localStorage.getItem('kimi_api_key');
      if (!apiKey) throw new Error("Missing Kimi Key");
      return await callOpenAICompatible(
        "https://api.moonshot.cn/v1", 
        apiKey, 
        "moonshot-v1-8k", 
        word, count, context, themes, strictMode, language, mode, customPrompt, documentContent
      );
    }
    else if (provider === 'qwen') {
      const apiKey = localStorage.getItem('qwen_api_key');
      if (!apiKey) throw new Error("Missing Qwen Key");
      return await callOpenAICompatible(
        "https://dashscope.aliyuncs.com/compatible-mode/v1", 
        apiKey, 
        "qwen-plus", 
        word, count, context, themes, strictMode, language, mode, customPrompt, documentContent
      );
    }
  } catch (error) {
    console.error(`${provider} API Error:`, error);
    throw error;
  }
}
