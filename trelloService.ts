import { TrelloConfig, TrelloCard, TrelloList, TeamMember } from '../types';

const BASE_URL = 'https://api.trello.com/1';

const cleanConfig = (config: TrelloConfig) => ({
  apiKey: config.apiKey?.trim(),
  token: config.token?.trim(),
  boardId: config.boardId?.trim(),
});

const handleResponse = async (response: Response, context: string) => {
  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const text = await response.text();
      if (text) errorMessage = text;
    } catch (e) {
      // ignore json parse error
    }
    
    if (response.status === 401) {
      throw new Error(`Unauthorized: Check your API Key and Token. (${errorMessage})`);
    }
    if (response.status === 404) {
      throw new Error(`Not Found: Check your Board ID. (${errorMessage})`);
    }
    throw new Error(`${context} failed (${response.status}): ${errorMessage}`);
  }
  return response.json();
};

export const verifyConnection = async (config: TrelloConfig) => {
  const { apiKey, token, boardId } = cleanConfig(config);
  
  if (!apiKey || !token || !boardId) {
    throw new Error("Missing credentials");
  }

  const url = `${BASE_URL}/boards/${boardId}?key=${apiKey}&token=${token}`;
  const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
  
  await handleResponse(response, "Connection Test");
  return true;
};

export const fetchTrelloLists = async (config: TrelloConfig): Promise<TrelloList[]> => {
    const { apiKey, token, boardId } = cleanConfig(config);
    if (!apiKey || !token || !boardId) throw new Error("Missing Config");

    const url = `${BASE_URL}/boards/${boardId}/lists?key=${apiKey}&token=${token}&filter=open`;
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    return await handleResponse(response, "Fetching Lists");
};

export const fetchTrelloCards = async (config: TrelloConfig): Promise<TrelloCard[]> => {
  const { apiKey, token, boardId } = cleanConfig(config);

  if (!apiKey || !token || !boardId) {
    throw new Error("Missing Trello Configuration");
  }

  // Fetch all cards on the board, including member information
  const url = `${BASE_URL}/boards/${boardId}/cards?key=${apiKey}&token=${token}&fields=name,desc,idList,url,idMembers&filter=visible`;
  
  const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
  return await handleResponse(response, "Fetching Cards");
};

export const fetchTrelloMembers = async (config: TrelloConfig) => {
  const { apiKey, token, boardId } = cleanConfig(config);

  if (!apiKey || !token || !boardId) {
    throw new Error("Missing Trello Configuration");
  }

  const url = `${BASE_URL}/boards/${boardId}/members?key=${apiKey}&token=${token}`;
  
  const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
  return await handleResponse(response, "Fetching Members");
};

/**
 * Enhanced mapping that returns cards grouped by member ID, plus unmatched cards
 */
export const organizeCardsByMember = (
  cards: TrelloCard[],
  lists: TrelloList[],
  trelloMembers: any[], 
  localTeam: TeamMember[]
) => {
  const memberCards: Record<string, TrelloCard[]> = {};
  const unassignedCards: TrelloCard[] = [];
  
  // Initialize map
  localTeam.forEach(m => memberCards[m.id] = []);

  // Create list lookup
  const listMap = new Map(lists.map(l => [l.id, l.name]));

  cards.forEach(card => {
    // Enrich card with list name
    const richCard = { ...card, listName: listMap.get(card.idList) || 'Unknown List' };

    if (!richCard.idMembers || richCard.idMembers.length === 0) {
        unassignedCards.push(richCard);
        return;
    }

    let assigned = false;
    richCard.idMembers.forEach((trelloMemberId: string) => {
      // 1. Try to find local member with this specific trelloMemberId saved
      let localMember = localTeam.find(m => m.trelloMemberId === trelloMemberId);

      // 2. If not found, try fuzzy name matching
      if (!localMember) {
        const tMember = trelloMembers.find((tm: any) => tm.id === trelloMemberId);
        if (tMember) {
            // Check exact name or inclusion
          localMember = localTeam.find(m => 
            m.name.toLowerCase() === tMember.fullName.toLowerCase() || 
            m.name.toLowerCase().includes(tMember.fullName.toLowerCase()) ||
            tMember.fullName.toLowerCase().includes(m.name.toLowerCase())
          );
        }
      }

      if (localMember) {
        memberCards[localMember.id].push(richCard);
        assigned = true;
      }
    });

    if (!assigned) {
        unassignedCards.push(richCard);
    }
  });

  return { memberCards, unassignedCards };
};

// Kept for backward compatibility if needed, but the UI should use organizeCardsByMember now
export const mapTrelloCardsToTeam = (
  cards: any[], 
  trelloMembers: any[], 
  localTeam: any[]
): Record<string, string[]> => {
    // ... logic is superseded by organizeCardsByMember usually, 
    // but useful for quick sync without the full audit view
    const { memberCards } = organizeCardsByMember(cards, [], trelloMembers, localTeam);
    const result: Record<string, string[]> = {};
    Object.keys(memberCards).forEach(key => {
        result[key] = memberCards[key].map(c => c.name);
    });
    return result;
};