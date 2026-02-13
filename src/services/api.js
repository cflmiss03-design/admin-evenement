const API_URL="https://vague-patty-amp1-2d1cfa97.koyeb.app/api";

export async function getCandidates(){
  const res=await fetch(`${API_URL}/manager`);
  if(!res.ok) throw new Error("Erreur chargement candidates");
  return res.json();
}

export async function requestWithdrawal(data){
  const res=await fetch(`${API_URL}/withdrawals/request`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(data)
  });

  if(!res.ok) throw new Error("Erreur retrait");
  return res.json();
}
