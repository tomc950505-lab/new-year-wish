export async function onRequestPost(context) {
    const { to, question, answer, msg } = await context.request.json();
    const key = `wish:${to.toLowerCase().trim()}`;
    
    // 尝试获取已存在的信件数据
    const existingData = await context.env.WISH_STORAGE.get(key, { type: "json" });
    
    let payload;
    if (existingData) {
        // 如果已存在，保留原有的问题和答案，将新消息追加到 messages 数组中
        payload = {
            ...existingData,
            messages: [...existingData.messages, msg]
        };
    } else {
        // 如果是第一封信，创建初始结构
        payload = {
            question: question,
            answer: answer.toLowerCase().trim(),
            messages: [msg]
        };
    }
    
    // 保存更新后的数据
    await context.env.WISH_STORAGE.put(key, JSON.stringify(payload));
    
    return new Response(JSON.stringify({ success: true }), {
        headers: { "content-type": "application/json" }
    });
}

// onRequestGet 保持原样，因为它已经支持返回 messages 数组
export async function onRequestGet(context) {
    const { searchParams } = new URL(context.request.url);
    const name = searchParams.get('name').toLowerCase().trim();
    const type = searchParams.get('type');
    const key = `wish:${name}`;
    
    const data = await context.env.WISH_STORAGE.get(key, { type: "json" });
    if (!data) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    if (type === 'question') {
        return new Response(JSON.stringify({ question: data.question }), {
            headers: { "content-type": "application/json" }
        });
    }

    if (type === 'verify') {
        const userAnswer = searchParams.get('answer').toLowerCase().trim();
        if (userAnswer === data.answer) {
            return new Response(JSON.stringify({ success: true, messages: data.messages }), {
                headers: { "content-type": "application/json" }
            });
        } else {
            return new Response(JSON.stringify({ success: false }), {
                headers: { "content-type": "application/json" }
            });
        }
    }
}