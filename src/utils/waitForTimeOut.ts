// function to wait for a timeout
export async function waitForTimeOut(time: number) {
  await new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
