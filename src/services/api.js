const API_URL="http://localhost:5000/api";

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
